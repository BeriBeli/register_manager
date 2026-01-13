import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Cpu, FileCode, BookOpen, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import { ProjectTree } from "./ProjectTree";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // Remove Projects/Registers/etc as they are context dependent or redundant with Dashboard
  { name: "Export", href: "/export", icon: FileCode },
  { name: "Docs", href: "/docs", icon: BookOpen },
];

export function Sidebar() {
  const location = useLocation();
  const isProjectView = location.pathname.startsWith("/project/");

  return (
    <aside className="w-64 border-r border-surface-800 bg-surface-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 border-b border-surface-800 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-surface-100">RegMgr</span>
        </div>
      </div>

      {isProjectView ? (
        // Project Context Sidebar
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-3 border-b border-surface-800">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          <ProjectTree />
        </div>
      ) : (
        // Global Navigation
        <nav className="flex-1 p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-primary-600/20 text-primary-400"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-surface-800 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1 rounded bg-surface-800/50 border border-surface-800/50">
          <div className="w-8 h-8 rounded bg-primary-900/50 text-primary-400 flex items-center justify-center border border-primary-500/20">
            <span className="font-bold text-xs">RM</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium text-surface-200 truncate">Register Manager</span>
            <span className="text-[10px] text-surface-500 truncate">v1.0.0</span>
          </div>
          {/* Simple user/settings placeholder since user asked for red area actions to be moved/consolidated */}
        </div>
      </div>
    </aside>
  );
}
