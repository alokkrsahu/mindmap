import { apiRequest, apiUpload } from './apiClient';
import type { GraphResponse } from '../types/api';

export const messageApi = {
  send: (sessionId: string, content: string) =>
    apiRequest<GraphResponse>(`/session/${sessionId}/message`, {
      method: 'POST',
      body: { content },
    }),

  expand: (sessionId: string, nodeId: string, nodeLabel: string) =>
    apiRequest<GraphResponse>(`/session/${sessionId}/expand`, {
      method: 'POST',
      body: { nodeId, nodeLabel },
    }),

  upload: (sessionId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<{ fileId: string; fileName: string }>(
      `/session/${sessionId}/upload`,
      formData,
    );
  },
};
