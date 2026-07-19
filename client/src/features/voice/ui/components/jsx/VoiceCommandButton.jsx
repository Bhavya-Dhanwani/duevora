import { useState, useCallback, useEffect } from "react";
import { HiOutlineMicrophone, HiOutlineXMark, HiCheckCircle } from "react-icons/hi2";
import useAudioRecorder from "./useAudioRecorder";
import { voiceApi } from "../../../api/voiceApi";
import s from "../css/VoiceCommandButton.module.css";

const speakText = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(
    (v) => v.name.toLowerCase().includes("google") && v.lang.startsWith("en")
  ) || voices.find((v) => v.lang.startsWith("en"));

  if (voice) {
    utterance.voice = voice;
  }
  window.speechSynthesis.speak(utterance);
};

export default function VoiceCommandButton() {
  const {
    isRecording,
    audioBlob,
    hasSpeech,
    error: recordError,
    isSupported,
    startRecording,
    stopRecording,
    resetRecorder,
  } = useAudioRecorder();

  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [triedVoice, setTriedVoice] = useState(false);
  const [messages, setMessages] = useState([]);
  const [createdDocs, setCreatedDocs] = useState([]);
  const [statusText, setStatusText] = useState("");

  const showTextInput = !isSupported || !!recordError;

  const handleClick = useCallback(() => {
    resetRecorder();
    setTextInput("");
    setTriedVoice(false);
    setMessages([]);
    setCreatedDocs([]);
    setStatusText("");
    setIsOpen(true);
    if (isSupported && !recordError) {
      setTimeout(() => {
        setTriedVoice(true);
        startRecording();
      }, 100);
    }
  }, [isSupported, recordError, startRecording, resetRecorder]);

  const handleSubmit = useCallback(async () => {
    const previousMessages = messages;

    let content = "";
    if (showTextInput) {
      if (!textInput.trim()) return;
      content = textInput;
    } else {
      if (!audioBlob) return;
      content = "Audio upload...";
    }

    setProcessing(true);
    setStatusText("Thinking...");

    const newUserMessage = { role: "user", content };
    const updatedMessages = [...messages, newUserMessage];

    // Optimistically update the UI to show the user's message
    setMessages(updatedMessages);

    // Copy audioBlob and clear state immediately to prevent infinite submission loop
    const currentBlob = audioBlob;
    if (!showTextInput) {
      resetRecorder();
      setTriedVoice(false);
    }

    try {
      let res;
      if (showTextInput) {
        res = await voiceApi.processCommand(textInput, messages);
      } else {
        res = await voiceApi.processAudioCommand(currentBlob, messages);
      }

      const responseData = res.data;

      // If server transcribes the audio, update the optimistically added message
      if (responseData.transcript) {
        newUserMessage.content = responseData.transcript;
      }

      if (responseData.action === "message") {
        const newAssistantMessage = { role: "assistant", content: responseData.message };
        setMessages([...updatedMessages, newAssistantMessage]);
        setStatusText("");
        speakText(responseData.message);

        // Auto-listen back for clarification
        if (!showTextInput) {
          setTimeout(() => {
            resetRecorder();
            setTriedVoice(true);
            startRecording();
          }, 1000);
        }
      } else if (responseData.action === "invoice_created" || responseData.action === "purchase_created") {
        const confirmMsg = responseData.confirmation || `Created ${responseData.action === "invoice_created" ? "invoice" : "purchase"} successfully.`;
        const newAssistantMessage = {
          role: "assistant",
          content: confirmMsg,
        };
        setMessages([...updatedMessages, newAssistantMessage]);

        setCreatedDocs((prev) => [
          {
            id: responseData.data._id,
            type: responseData.action === "invoice_created" ? "Invoice" : "Purchase",
            number: responseData.action === "invoice_created" ? responseData.data.invoiceNumber : responseData.data.purchaseNumber,
            party: responseData.action === "invoice_created" ? responseData.data.customer : responseData.data.vendor,
            total: responseData.data.grandTotal,
            items: responseData.data.items,
          },
          ...prev,
        ]);

        setStatusText("Success!");
        speakText(confirmMsg);

        // Auto-listen back for next command
        if (!showTextInput) {
          setTimeout(() => {
            resetRecorder();
            setTriedVoice(true);
            setStatusText("");
            startRecording();
          }, 2500);
        }
      }
    } catch (err) {
      setStatusText("Error processing command.");
      const errMessage = err.response?.data?.message || "Failed to process command. Please try again.";
      setMessages(previousMessages);
      speakText("Sorry, I didn't catch that. Please try again.");
    } finally {
      setProcessing(false);
      setTextInput("");
    }
  }, [showTextInput, textInput, audioBlob, messages, startRecording, resetRecorder]);

  // Submit audio automatically when recording finishes
  useEffect(() => {
    if (!isOpen) return;

    if (audioBlob && !isRecording && !processing && triedVoice && hasSpeech) {
      handleSubmit();
    } else if (!audioBlob && !isRecording && triedVoice && !hasSpeech && !processing) {
      // Re-trigger start recording automatically to keep the hands-free loop alive on silence!
      const timer = setTimeout(() => {
        resetRecorder();
        setTriedVoice(true);
        startRecording();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [audioBlob, isRecording, processing, triedVoice, hasSpeech, isOpen, handleSubmit, startRecording, resetRecorder]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTriedVoice(false);
    setTextInput("");
    stopRecording();
    resetRecorder();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [stopRecording, resetRecorder]);

  return (
    <>
      <button
        className={`${s.micBtn} ${isRecording ? s.listening : ""}`}
        onClick={handleClick}
        title="Voice Command"
        type="button"
      >
        <HiOutlineMicrophone />
      </button>

      {isOpen && (
        <div className={s.overlay} onClick={handleClose}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h3>{showTextInput ? "AI Command" : "Voice Command (Continuous)"}</h3>
              <button className={s.closeBtn} onClick={handleClose} type="button">
                <HiOutlineXMark />
              </button>
            </div>

            <div className={s.body}>
              {/* Transaction log of created documents */}
              {createdDocs.length > 0 && (
                <div className={s.createdDocsList}>
                  {createdDocs.map((doc, idx) => (
                    <div key={doc.id || idx} className={s.docCard}>
                      <div className={s.docHeader}>
                        <span><HiCheckCircle style={{ display: "inline", marginRight: "4px" }} />{doc.type} #{doc.number}</span>
                        <span className={s.docTotal}>${Number(doc.total).toFixed(2)}</span>
                      </div>
                      <p className={s.docParty}>{doc.party}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat conversation context */}
              {messages.length > 0 && (
                <div className={s.conversation}>
                  {messages.filter(m => m.content !== "Audio upload...").map((msg, i) => (
                    <div key={i} className={`${s.chatBubble} ${msg.role === "user" ? s.userBubble : s.aiBubble}`}>
                      <span className={s.bubbleRole}>{msg.role === "user" ? "You" : "AI"}</span>
                      <p className={s.bubbleContent}>{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Microphone recording status/visualizer */}
              {!showTextInput && (
                <div className={`${s.pulseRing} ${isRecording ? s.active : ""}`}>
                  <div className={s.micLarge}>
                    <HiOutlineMicrophone />
                  </div>
                </div>
              )}

              <p className={s.status}>
                {isRecording
                  ? "Listening..."
                  : processing
                    ? statusText
                    : showTextInput
                      ? "Type a command below"
                      : "Speak naturally..."}
              </p>

              {recordError && !showTextInput && (
                <p className={s.error}>{recordError} Falling back to text input.</p>
              )}

              {showTextInput && (
                <div className={s.transcriptBox}>
                  <textarea
                    className={s.textInput}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder='e.g. "Sell 5 widgets to Acme Corp at $25 each"'
                    rows={3}
                    autoFocus
                  />
                </div>
              )}

              <div className={s.actions}>
                {showTextInput ? (
                  <button
                    className={s.submitBtn}
                    onClick={handleSubmit}
                    disabled={processing || !textInput.trim()}
                    type="button"
                    style={{ flex: 1 }}
                  >
                    {processing ? "Processing..." : "Send Command"}
                  </button>
                ) : (
                  <>
                    {isRecording ? (
                      <button className={s.stopBtn} onClick={stopRecording} type="button">
                        Stop Recording
                      </button>
                    ) : (
                      <button className={s.startBtn} onClick={startRecording} type="button">
                        Start Recording
                      </button>
                    )}
                    {showTextInput && textInput && (
                      <button className={s.submitBtn} onClick={handleSubmit} disabled={processing} type="button">
                        {processing ? "Processing..." : "Send"}
                      </button>
                    )}
                  </>
                )}
              </div>

              <p className={s.hint}>
                {showTextInput
                  ? '"Sell 5 widgets to Acme at $25 each" or "Buy 10 laptops from TechSupply at $800"'
                  : "Continuous voice mode active. Speak naturally, pause to send, and keep going."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
