import { apiRequest } from './apiClient';
import type { SessionResponse, HistoryResponse, SessionListResponse } from '../types/api';

export const sessionApi = {
  list: () =>
    apiRequest<SessionListResponse>('/sessions'),

  create: () =>
    apiRequest<SessionResponse>('/session', { method: 'POST' }),

  getHistory: (sessionId: string) =>
    apiRequest<HistoryResponse>(`/session/${sessionId}/history`),

  delete: (sessionId: string) =>
    apiRequest<{ deleted: boolean }>(`/session/${sessionId}`, { method: 'DELETE' }),
};
