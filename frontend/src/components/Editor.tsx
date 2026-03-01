import { Sidebar } from './Sidebar/Sidebar';
import { GraphCanvas } from './GraphCanvas/GraphCanvas';
import { useSessionInit } from '../hooks/useSessionInit';

export function Editor() {
  useSessionInit();

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100">
      <main className="flex-1 relative">
        <GraphCanvas />
      </main>
      <Sidebar />
    </div>
  );
}
