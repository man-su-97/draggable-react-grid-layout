"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

export default function AudioVisualizerTest() {
  const [recording, setRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup AudioContext
      audioCtxRef.current = new AudioContext();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128; // smaller = fewer, bigger bars
      source.connect(analyserRef.current);

      drawWaveform();

      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    audioCtxRef.current?.close();
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const ctx = canvasRef.current.getContext("2d")!;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationIdRef.current = requestAnimationFrame(render);

      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);

      const barWidth = (canvasRef.current!.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = "#ef4444"; // red
        ctx.fillRect(x, canvasRef.current!.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    render();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded bg-card w-[300px]">
      <h2 className="font-semibold text-lg">Audio Visualizer Test</h2>

      {/* Canvas for waveform */}
      <canvas ref={canvasRef} width={260} height={60} className="border rounded bg-white" />

      {/* Start/Stop Button */}
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`flex items-center gap-2 px-4 py-2 rounded ${
          recording ? "bg-red-500 text-white" : "bg-blue-500 text-white"
        }`}
      >
        {recording ? <MicOff size={18} /> : <Mic size={18} />}
        {recording ? "Stop" : "Start Mic"}
      </button>
    </div>
  );
}
