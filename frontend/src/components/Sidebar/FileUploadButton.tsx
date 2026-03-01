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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-300 text-xs border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Upload a file"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        Upload
      </button>
    </>
  );
}
