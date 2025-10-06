"use client";

import { useRef, useState, useEffect } from "react";
import { Mic, X, AudioLines, Pause } from "lucide-react";
import { createPortal } from "react-dom";
import { WavyBackground } from "@/components/ui/wavy-background";


interface SmartVoiceInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  onResult?: (text: string) => void;
  asButton?: boolean;
  inactivityDelay?: number;
}

export default function SmartVoiceInput({
  placeholder,
  value,
  onChange,
  onResult,
  asButton = false,
  inactivityDelay = 4000,
}: SmartVoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [mounted, setMounted] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  

  useEffect(() => {
    setMounted(true);
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

 

  const initRecognition = (): SpeechRecognition | null => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return null;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");

      onChange?.(transcript);
      resetInactivityTimer(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        onResult?.(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("[SmartVoiceInput] Speech recognition error:", event.error);
      stopRecording(true);
    };

    recognition.onend = () => {
      if (recording) setListening(false);
    };

    return recognition;
  };



  const startRecording = () => {
    if (recording) return;

    const recognition = initRecognition();
    if (!recognition) return;

    recognition.start();
    recognitionRef.current = recognition;

    setRecording(true);
    onChange?.("");
    resetInactivityTimer();
  };

  const stopRecording = (auto = false) => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRecording(false);
    setListening(false);

    if (!auto && value?.trim()) onResult?.(value.trim());
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    } else {
      const recognition = initRecognition();
      if (!recognition) return;

      recognition.start();
      recognitionRef.current = recognition;
      resetInactivityTimer();
    }
  };

  const resetInactivityTimer = (text?: string) => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (text && text.trim()) stopRecording(false);
      else stopRecording(true);
    }, inactivityDelay);
  };



  const micButton = (
    <button
      type="button"
      onClick={recording ? () => stopRecording(false) : startRecording}
      className="ml-2 p-2 rounded-full bg-muted hover:bg-muted/80 transition"
      aria-label="Toggle voice recording"
    >
      <Mic size={18} className={recording ? "text-red-500" : ""} />
    </button>
  );

  return (
    <>
      {!asButton ? (
        <div className="flex items-center border border-border rounded px-2 py-1 w-72 bg-card text-card-foreground">
          <input
            type="text"
            className="flex-1 bg-transparent outline-none"
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {micButton}
        </div>
      ) : (
        micButton
      )}

      {/* Fullscreen overlay during recording */}
      {mounted &&
        recording &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between">
            <WavyBackground
              className="w-full h-full"
              containerClassName="absolute inset-0"
              backgroundFill="black"
              blur={15}
              waveOpacity={0.6}
              speed="fast"
            />
            <div className="absolute inset-0 bg-black/10 z-10" />

            <div className="relative z-20 flex items-center justify-center mt-32">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-6 py-4 text-white text-lg border border-white/20 backdrop-blur-md shadow-lg">
                {listening ? (
                  <AudioLines
                    className="text-blue-400 animate-pulse"
                    size={28}
                  />
                ) : (
                  <Pause className="text-gray-400" size={28} />
                )}
                <span>
                  {value && value.trim().length > 0
                    ? value
                    : listening
                    ? "Listening..."
                    : "Paused"}
                </span>
              </div>
            </div>

            <div className="relative z-20 mb-12 flex items-center gap-12">
              {/* Toggle mic */}
              <button
                onClick={toggleListening}
                className={`flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition relative ${
                  listening
                    ? "bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse ring-4 ring-blue-500/40"
                    : "bg-gray-600"
                }`}
                aria-label="Toggle listening"
              >
                <Mic size={38} className="text-white" />
                {listening && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-blue-500/30" />
                )}
              </button>

              {/* Stop button */}
              <button
                onClick={() => stopRecording(false)}
                className="flex items-center justify-center w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 shadow-lg ring-4 ring-red-500/30"
                aria-label="Stop recording"
              >
                <X size={36} className="text-white" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
