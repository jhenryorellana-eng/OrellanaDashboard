/**
 * Wrapper mínimo sobre la Web Speech API (reconocimiento de voz del navegador).
 * Soporte real en Chrome/Edge/Safari. Si no existe, devolvemos null y la UI
 * cae con elegancia a "solo audio".
 */

export interface SpeechController {
  start: () => void;
  stop: () => void;
}

interface SpeechCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
}

// Tipos mínimos de la Web Speech API (no incluidos en lib.dom estándar).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window
  );
}

export function createSpeechController(
  callbacks: SpeechCallbacks,
  lang = "es-ES",
): SpeechController | null {
  if (!speechSupported()) return null;
  const Ctor =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  const recognition = new (Ctor as new () => SpeechRecognitionLike)();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let partial = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const transcript = res[0].transcript;
      if (res.isFinal) {
        callbacks.onFinal(transcript);
      } else {
        partial += transcript;
      }
    }
    if (partial) callbacks.onPartial(partial);
  };

  recognition.onerror = (event) => callbacks.onError?.(event.error);

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        /* ya iniciado: ignorar */
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        /* ya detenido: ignorar */
      }
    },
  };
}
