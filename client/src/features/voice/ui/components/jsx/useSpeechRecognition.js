import { useState, useRef, useCallback } from "react";

const ERROR_MESSAGES = {
  network: "Speech service unavailable.",
  "not-allowed": "Microphone permission denied.",
  "service-not-allowed": "Speech service blocked by browser.",
  "audio-capture": "No microphone detected.",
  "no-speech": "No speech detected. Try again.",
  aborted: null,
};

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [speechFailed, setSpeechFailed] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setSpeechFailed(true);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(ERROR_MESSAGES[event.error] || `Error: ${event.error}`);
        if (event.error === "network" || event.error === "not-allowed" || event.error === "audio-capture") {
          setSpeechFailed(true);
        }
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        recognitionRef.current = null;
        const newRecognition = initRecognition();
        if (newRecognition) {
          recognitionRef.current = newRecognition;
          newRecognition.start();
          setIsListening(true);
        }
      }
    }
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    isSupported: isSupported && !speechFailed,
    speechFailed,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
