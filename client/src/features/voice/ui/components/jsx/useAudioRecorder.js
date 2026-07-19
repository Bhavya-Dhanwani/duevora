import { useState, useRef, useCallback } from "react";

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [hasSpeech, setHasSpeech] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunksRef = useRef([]);

  const isSupported = typeof window !== "undefined" && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setHasSpeech(false);
    chunksRef.current = [];

    if (!isSupported) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Setup Web Audio API for silence detection
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeechTime = Date.now();
      let speechDetected = false;
      const silenceThreshold = 4; // Volume threshold (0-255) to trigger silence
      const silenceDuration = 1800; // 1.8 seconds of silence to trigger stop
      const initialSilenceTimeout = 5000; // 5 seconds of initial silence to trigger stop
      const maxDuration = 15000; // 15 seconds max recording duration
      const startTime = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!speechDetected) {
          setHasSpeech(false);
          setAudioBlob(null);
        } else {
          setHasSpeech(true);
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      };

      const checkSilence = () => {
        if (mediaRecorder.state === "inactive") return;

        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const averageVolume = sum / bufferLength;
        const now = Date.now();
        
        // Max recording time safety cutoff
        if (now - startTime > maxDuration) {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            setIsRecording(false);
          }
          return;
        }

        if (averageVolume > silenceThreshold) {
          if (!speechDetected) {
            speechDetected = true;
          }
          lastSpeechTime = now;
        } else {
          // If no speech detected yet, stop after initialSilenceTimeout (5s)
          if (!speechDetected && (now - startTime > initialSilenceTimeout)) {
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
              setIsRecording(false);
            }
            return;
          }
          // If speech was detected, stop after silenceDuration (1.8s) of pause
          if (speechDetected && (now - lastSpeechTime > silenceDuration)) {
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
              setIsRecording(false);
            }
            return;
          }
        }

        requestAnimationFrame(checkSilence);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      requestAnimationFrame(checkSilence);
    } catch (err) {
      setError(err.message || "Failed to access microphone.");
      setIsRecording(false);
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const resetRecorder = useCallback(() => {
    setAudioBlob(null);
    setHasSpeech(false);
    setError(null);
  }, []);

  return {
    isRecording,
    audioBlob,
    hasSpeech,
    error,
    isSupported,
    startRecording,
    stopRecording,
    resetRecorder,
  };
}
