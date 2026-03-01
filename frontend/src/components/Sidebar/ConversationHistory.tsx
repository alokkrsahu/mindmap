import { useChatStore } from '../../store';

export function ConversationHistory() {
  const messages = useChatStore((s) => s.messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm px-4 text-center">
        Enter a topic above to generate a mind map
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 px-1">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`text-sm rounded-lg px-3 py-2 ${
            msg.role === 'user'
              ? 'bg-blue-600/20 text-blue-200 ml-4'
              : 'bg-slate-700/50 text-slate-300 mr-4'
          }`}
        >
          {msg.content}
        </div>
      ))}
    </div>
  );
}
