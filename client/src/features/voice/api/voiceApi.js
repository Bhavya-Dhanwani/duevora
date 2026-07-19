import api from "../../../lib/api";

export const voiceApi = {
  processCommand: async (transcript, messages = []) => {
    const response = await api.post("/voice/command", { transcript, messages });
    return response.data;
  },
  processAudioCommand: async (audioBlob, messages = []) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "command.webm");
    formData.append("messages", JSON.stringify(messages));

    const response = await api.post("/voice/audio", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
