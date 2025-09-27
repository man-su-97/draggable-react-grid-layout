"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useStartStream, useStopStream } from "@/hooks/useMediamtx";
import { Protocol, StartStreamDTO } from "@/types/mediamtx-types";

type Props = {
  streamPath: string; 
};

export default function StreamPlayer({ streamPath }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [webrtcFailed, setWebrtcFailed] = useState(false);
  const [mode, setMode] = useState<"webrtc" | "hls">("webrtc");
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  const { mutateAsync: startStream } = useStartStream();
  const { mutateAsync: stopStream } = useStopStream();

  
  const startDrawing = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawFrame = () => {
      if (
        videoRef.current &&
        !videoRef.current.paused &&
        !videoRef.current.ended
      ) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
      animationRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const stopDrawing = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const showCanvasError = (message: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff0000";
    ctx.font = "20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  };

  /** Cleanup: stop backend stream + local state */
  const cleanup = useCallback(async () => {
    stopDrawing();

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    if (currentPath) {
      try {
        await stopStream(currentPath);
      } catch (err) {
        console.warn("Failed to stop backend stream:", err);
      }
      setCurrentPath(null);
    }
  }, [currentPath, stopStream]);

  /** WebRTC mode */
  useEffect(() => {
    if (mode !== "webrtc") return;

    let pc: RTCPeerConnection | null = null;

    async function startWebRTC() {
      try {
        const dto: StartStreamDTO = { rtspUrl: streamPath, protocol: Protocol.WEBRTC };
        const { path, url: webrtcUrl } = await startStream(dto);
        setCurrentPath(path);

        pc = new RTCPeerConnection();
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (event) => {
          const video = videoRef.current;
          if (video) {
            video.srcObject = event.streams[0];
            video
              .play()
              .then(startDrawing)
              .catch(() => showCanvasError("WebRTC autoplay failed"));
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const res = await fetch(webrtcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });

        if (!res.ok) throw new Error(`WHEP failed: ${res.status}`);

        const answerSdp = await res.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        pcRef.current = pc;
      } catch (err) {
        console.error("⚠️ WebRTC failed:", err);
        setWebrtcFailed(true);
        setMode("hls");
      }
    }

    startWebRTC();

    return () => {
      cleanup();
      pc?.close();
    };
  }, [mode, streamPath, startStream, cleanup]);

  /** HLS mode */
  useEffect(() => {
    if (mode !== "hls") return;

    const video = videoRef.current;
    if (!video) return;

    async function startHLS() {
      try {
        const dto: StartStreamDTO = { rtspUrl: streamPath, protocol: Protocol.HLS };
        const { path, url: hlsUrl } = await startStream(dto);
        setCurrentPath(path);
        if (!video) return;
        
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(hlsUrl);
          hls.attachMedia(video as HTMLMediaElement);

          video.onloadedmetadata = () => {
             const v = videoRef.current;
            if (v && canvasRef.current) {
              canvasRef.current.width = v.videoWidth;
              canvasRef.current.height = v.videoHeight;
            }
          };

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video
              .play()
              .then(startDrawing)
              .catch(() => showCanvasError("HLS autoplay blocked"));
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("HLS error:", data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  showCanvasError("Fatal HLS error");
                  break;
              }
            }
          });

          hlsRef.current = hls;
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsUrl;
          video.onloadedmetadata = () => {
            video
              .play()
              .then(startDrawing)
              .catch(() => showCanvasError("Native HLS failed"));
          };
        }
      } catch (err) {
        console.error("⚠️ HLS failed:", err);
        showCanvasError("Failed to start HLS stream");
      }
    }

    startHLS();

    return () => {
      cleanup();
    };
  }, [mode, streamPath, startStream, cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="bg-black rounded"
      />
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <div className="flex gap-2">
        <button
          className={`no-drag px-4 py-2 rounded ${
            mode === "webrtc" ? "bg-blue-600 text-white" : "bg-gray-400"
          }`}
          onClick={() => setMode("webrtc")}
        >
          WebRTC
        </button>
        <button
          className={`no-drag px-4 py-2 rounded ${
            mode === "hls" ? "bg-blue-600 text-white" : "bg-gray-400"
          }`}
          onClick={() => setMode("hls")}
        >
          HLS
        </button>
        {webrtcFailed && mode === "webrtc" && (
          <p className="text-red-600 text-sm">WebRTC failed — switched to HLS.</p>
        )}
      </div>
    </div>
  );
}
