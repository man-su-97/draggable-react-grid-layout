// // src/types/global.d.ts
// // interface SpeechRecognition extends EventTarget {
// //   lang: string;
// //   continuous: boolean;
// //   interimResults: boolean;
// //   maxAlternatives: number;
// //   start(): void;
// //   stop(): void;
// //   abort(): void;
// //   onaudioend?: (event: Event) => void;
// //   onaudiostart?: (event: Event) => void;
// //   onend?: (event: Event) => void;
// //   onerror?: (event: SpeechRecognitionEvent) => void;
// //   onnomatch?: (event: Event) => void;
// //   onresult?: (event: SpeechRecognitionEvent) => void;
// //   onsoundend?: (event: Event) => void;
// //   onsoundstart?: (event: Event) => void;
// //   onspeechend?: (event: Event) => void;
// //   onspeechstart?: (event: Event) => void;
// //   onstart?: (event: Event) => void;
// // }

// interface SpeechRecognitionImp extends SpeechRecognitionEvent {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   maxAlternatives: number;
//   start(): void;
//   stop(): void;
//   abort(): void;
//   onaudioend?: (event: Event) => void;
//   onaudiostart?: (event: Event) => void;
//   onend?: (event: Event) => void;
//   onerror?: (event: SpeechRecognitionErrorEvent) => void;
//   onnomatch?: (event: Event) => void;
//   onresult?: (event: SpeechRecognitionEvent) => void;
//   onsoundend?: (event: Event) => void;
//   onsoundstart?: (event: Event) => void;
//   onspeechend?: (event: Event) => void;
//   onspeechstart?: (event: Event) => void;
//   onstart?: (event: Event) => void;
// }

// interface SpeechRecognitionEvent extends Event {
//   results: SpeechRecognitionResultList;
// }

// interface Window {
//   SpeechRecognition: typeof SpeechRecognition;
//   webkitSpeechRecognition: typeof SpeechRecognition;
// }


// src/types/global.d.ts

// Constructor type
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Main SpeechRecognition interface
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
  onerror?: (event: SpeechRecognitionErrorEvent) => void;
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

// Extend window
interface Window {
  SpeechRecognition: SpeechRecognitionConstructor;
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}
