import { useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSessionStore, useChatStore } from '../../store';
import { messageApi } from '../../services/messageApi';

export function FileUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = useSessionStore((s) => s.sessionId);
  const isLoading = useSessionStore((s) => s.isLoading);
  const setLoading = useSessionStore((s) => s.setLoading);
  const addMessage = useChatStore((s) => s.addMessage);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !sessionId) return;

      setLoading(true, 'Uploading file...');

      try {
        const result = await messageApi.upload(sessionId, file);
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: `File uploaded: ${result.fileName}. You can now ask questions about it.`,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Upload failed:', err);
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: 'File upload failed. Please try again.',
          timestamp: Date.now(),
        });
      } finally {
        setLoading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [sessionId, setLoading, addMessage],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleUpload}
        className="hidden"
        accept=".pdf,.txt,.md,.doc,.docx,.csv,.json"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isLoading || !sessionId}
        className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Upload a file"
      >
        Upload
      </button>
    </>
  );
}
