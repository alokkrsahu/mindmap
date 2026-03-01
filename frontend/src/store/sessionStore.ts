import { create } from 'zustand';

interface SessionState {
  sessionId: string | null;
  isLoading: boolean;
  loadingMessage: string;

  setSessionId: (id: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionId: null,
  isLoading: false,
  loadingMessage: '',

  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading, message = '') =>
    set({ isLoading: loading, loadingMessage: message }),
}));
