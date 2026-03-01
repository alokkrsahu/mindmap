import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatState {
  messages: ChatMessage[];

  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],

  addMessage: (message) =>
    set({ messages: [...get().messages, message] }),

  clearMessages: () => set({ messages: [] }),
}));
