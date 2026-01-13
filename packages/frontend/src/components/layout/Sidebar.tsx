import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Cpu, FileCode, BookOpen, ChevronLeft, Sun, Moon, Globe } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { ProjectTree } from "./ProjectTree";
import { SettingsDialog } from "../settings/SettingsDialog";

const navigation = [
  { name: "Projects", href: "/", icon: LayoutDashboard },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const isProjectView = location.pathname.startsWith("/project/");
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
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
                {t('sidebar.back_to_projects')}
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
                  {t(`sidebar.${item.name.toLowerCase()}`)}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-surface-800 shrink-0">
          {/* App Info - Trigger for Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded bg-surface-800/0 hover:bg-surface-800 border border-surface-800/0 hover:border-surface-700 transition-all group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded bg-primary-900/50 text-primary-400 flex items-center justify-center border border-primary-500/20 group-hover:border-primary-500/50 transition-colors">
              <span className="font-bold text-xs">P</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-medium text-surface-200 truncate group-hover:text-surface-100 transition-colors">Register Manager</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-surface-500 truncate group-hover:text-surface-400">Settings & Info</span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Settings Dialog */}
      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
