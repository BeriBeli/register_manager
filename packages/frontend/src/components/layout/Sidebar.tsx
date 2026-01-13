import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Cpu, FileCode, BookOpen, ChevronLeft, Sun, Moon, Globe } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { ProjectTree } from "./ProjectTree";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // Remove Projects/Registers/etc as they are context dependent or redundant with Dashboard
  { name: "Export", href: "/export", icon: FileCode },
  { name: "Docs", href: "/docs", icon: BookOpen },
];

export function Sidebar() {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
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
              {t('sidebar.back_to_dashboard')}
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
      <div className="p-3 border-t border-surface-800 shrink-0 space-y-3">
        {/* Utilities: Theme & Language */}
        <div className="flex items-center justify-between px-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-surface-800 rounded-md p-0.5 border border-surface-700">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={clsx(
                "px-2 py-0.5 text-xs font-medium rounded transition-colors",
                i18n.language.startsWith('en')
                  ? "bg-primary-600 text-white"
                  : "text-surface-400 hover:text-surface-200"
              )}
            >
              EN
            </button>
            <button
              onClick={() => i18n.changeLanguage('zh')}
              className={clsx(
                "px-2 py-0.5 text-xs font-medium rounded transition-colors",
                i18n.language.startsWith('zh')
                  ? "bg-primary-600 text-white"
                  : "text-surface-400 hover:text-surface-200"
              )}
            >
              中文
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 text-surface-400 hover:text-primary-400 hover:bg-surface-800 rounded-md transition-colors"
            title={theme === 'dark' ? t('sidebar.theme.light') : t('sidebar.theme.dark')}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* App Info */}
        <div className="flex items-center gap-3 px-2 py-1 rounded bg-surface-800/50 border border-surface-800/50">
          <div className="w-8 h-8 rounded bg-primary-900/50 text-primary-400 flex items-center justify-center border border-primary-500/20">
            <span className="font-bold text-xs">RM</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium text-surface-200 truncate">Register Manager</span>
            <span className="text-[10px] text-surface-500 truncate">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
