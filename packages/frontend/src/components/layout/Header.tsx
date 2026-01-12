import { Download, Settings, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 border-b border-surface-800 bg-surface-900/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-surface-300">
          Register Manager
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn-ghost p-2">
          <Download className="w-4 h-4" />
        </button>
        <button className="btn-ghost p-2">
          <Settings className="w-4 h-4" />
        </button>
        <button className="btn-ghost p-2">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
