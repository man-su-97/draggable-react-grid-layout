"use client";

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

type VoiceInputProps = {
  onResult: (text: string) => void;
  lang?: string;
};

export default function VoiceInput({ onResult, lang = "en-US" }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const initRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Your browser does not support speech recognition.");
      return null;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      toast.info("Listening... Speak your command clearly.");
    };

    recognition.onend = () => setListening(false);

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setListening(false);

      if (e.error === "not-allowed") {
        toast.error("Microphone blocked. Please allow microphone access in browser settings.");
      } else {
        toast.error("Speech recognition failed. Try again.");
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      toast.success(`You said: "${text}"`);
    };

    recognitionRef.current = recognition;
    return recognition;
  };

  const handleToggle = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      const recognition = initRecognition();
      recognition?.start();
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant={listening ? "destructive" : "outline"}
      className={`flex items-center gap-2 transition ${
        listening ? "animate-pulse" : ""
      }`}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
      {listening ? "Stop" : "Speak"}
    </Button>
  );
}
