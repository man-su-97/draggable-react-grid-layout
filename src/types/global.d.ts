// src/types/global.d.ts
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudioend?: (event: Event) => void;
  onaudiostart?: (event: Event) => void;
  onend?: (event: Event) => void;
  onerror?: (event: Event) => void;
  onnomatch?: (event: Event) => void;
  onresult?: (event: SpeechRecognitionEvent) => void;
  onsoundend?: (event: Event) => void;
  onsoundstart?: (event: Event) => void;
  onspeechend?: (event: Event) => void;
  onspeechstart?: (event: Event) => void;
  onstart?: (event: Event) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
