import { useState, useCallback, useRef, useEffect } from "react";

type SpeechRecognitionResultEntry = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionResultEntry;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
  error?: string;
};

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface WindowWithSpeechRecognition extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef(false);
  const startLockRef = useRef(false);
  const [isSpeechRecognitionReady, setIsSpeechRecognitionReady] = useState(false);

  useEffect(() => {
    // Initialize Speech Recognition on mount. Prefer webkit implementation for broader compatibility.
    if (typeof window !== "undefined") {
      const speechWindow = window as WindowWithSpeechRecognition;
      const SpeechRecognitionAPI = speechWindow.webkitSpeechRecognition || speechWindow.SpeechRecognition;
      if (!SpeechRecognitionAPI) {
        queueMicrotask(() => {
          setError("Speech Recognition not supported in this browser");
        });
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        startLockRef.current = false;
        isListeningRef.current = true;
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + " ";
          }
        }

        if (finalTranscript.trim()) {
          setTranscript((prev) => (prev ? prev + " " + finalTranscript.trim() : finalTranscript.trim()));
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        startLockRef.current = false;
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        queueMicrotask(() => {
          setError(event.error || "Speech recognition error");
          isListeningRef.current = false;
          startLockRef.current = false;
          setIsListening(false);
        });
      };

      recognitionRef.current = recognition;
      queueMicrotask(() => {
        setIsSpeechRecognitionReady(true);
      });
    }
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || isListeningRef.current || startLockRef.current) return;

    setTranscript("");
    startLockRef.current = true;
    isListeningRef.current = true;

    try {
      recognition.start();
    } catch (err) {
      isListeningRef.current = false;
      startLockRef.current = false;
      setIsListening(false);
      if (!(err instanceof DOMException && err.name === "InvalidStateError")) {
        setError(err instanceof Error ? err.message : "Speech recognition error");
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSpeechRecognitionReady,
  };
}
