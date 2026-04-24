import api from "../lib/axios";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
}

const aiService = {
  chat: async (messages: ChatMessage[]): Promise<ChatResponse> => {
    try {
      const response = await api.post<ChatResponse>("/ai/chat", { messages });
      return response.data;
    } catch (error: any) {
      console.error("AI Service Error:", error);
      throw new Error(error.response?.data?.message || "Failed to communicate with AI.");
    }
  },
};

export default aiService;
