"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

type SmartVoiceInputProps = {
  placeholder?: string;
  onResult?: (text: string) => void;
  asButton?: boolean; // 🔹 if true, render only mic button
};

export default function SmartVoiceInput({
  placeholder,
  onResult,
  asButton = false,
}: SmartVoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio context
      audioCtxRef.current = new AudioContext();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      source.connect(analyserRef.current);

      // SpeechRecognition setup
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        const transcript = e.results[0][0].transcript;
        setText(transcript);
        onResult?.(transcript);
      };

      recognition.onend = () => stopRecording();

      recognition.start();
      recognitionRef.current = recognition;

      setRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recognitionRef.current?.stop();
    audioCtxRef.current?.close();
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
  };

  // 🔥 Effect runs after canvas is mounted when recording=true
  useEffect(() => {
    if (recording && canvasRef.current && analyserRef.current) {
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
          ctx.fillStyle = "#4f46e5";
          ctx.fillRect(
            x,
            canvasRef.current!.height - barHeight,
            barWidth,
            barHeight
          );
          x += barWidth + 1;
        }
      };

      render();
    }

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, [recording]);

  // 🔹 Mic button UI
  const micButton = (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      className="ml-2 p-1 rounded-full bg-muted hover:bg-muted/80"
    >
      {recording ? (
        <MicOff size={18} className="text-red-500" />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );

  if (asButton) {
    // 🎤 Mic only mode
    return micButton;
  }

  // 📝 Full input + mic mode
  return (
    <div className="flex items-center justify-between border border-border rounded px-2 py-1 w-72 bg-card text-card-foreground">
      <div className="">
        {!recording ? (
          <input
            type="text"
            className="flex-1 bg-transparent outline-none"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <canvas ref={canvasRef} width={200} height={20} />
        )}
      </div>
      {micButton}
    </div>
  );
}
