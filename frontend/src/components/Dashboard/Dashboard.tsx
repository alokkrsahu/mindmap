import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { sessionApi } from '../../services/sessionApi';
import type { SessionListItem } from '../../types/api';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

export function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionApi.list().then((res) => {
      setSessions(res.sessions);
    }).catch((err) => {
      console.error('Failed to load sessions:', err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleNewSession = useCallback(async () => {
    try {
      const res = await sessionApi.create();
      navigate(`/session/${res.sessionId}`);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }, [navigate]);

  const handleOpenSession = useCallback((id: string) => {
    navigate(`/session/${id}`);
  }, [navigate]);

  const handleDeleteSession = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await sessionApi.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-8 py-6">
        <h1 className="text-2xl font-bold">MindMap AI</h1>
        <p className="text-sm text-slate-400 mt-1">
          Create interactive mind maps powered by AI
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* New session button */}
        <motion.button
          onClick={handleNewSession}
          className="w-full mb-8 p-6 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-900/50 transition-colors cursor-pointer text-left"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-xl font-bold">
              +
            </div>
            <div>
              <p className="text-lg font-semibold">New Mind Map</p>
              <p className="text-sm text-slate-400">
                Start a new conversation and generate a mind map
              </p>
            </div>
          </div>
        </motion.button>

        {/* Sessions grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-slate-500 py-16">
            No sessions yet. Create your first mind map!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                onClick={() => handleOpenSession(session.id)}
                className="relative text-left p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800/60 transition-colors cursor-pointer group"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete session"
                >
                  &times;
                </button>

                <p className="font-medium text-sm text-slate-100 line-clamp-2 min-h-[2.5rem] pr-6">
                  {session.firstMessage
                    ? truncate(session.firstMessage, 80)
                    : 'Empty session'}
                </p>
                {session.lastSummary && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {truncate(session.lastSummary, 120)}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span>{formatDate(session.createdAt)}</span>
                  <span>{session.messageCount} messages</span>
                  <span>{session.graphCount} graphs</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
