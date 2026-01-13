import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Cpu, FileCode, BookOpen, ChevronLeft, Sun, Moon, Globe, LogOut, User, Settings, Shield } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { ProjectTree } from "./ProjectTree";
import { SettingsDialog } from "../settings/SettingsDialog";
import { useSession, signOut } from "../../lib/auth-client";

const navigation = [
  { name: "Projects", href: "/", icon: LayoutDashboard },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isProjectView = location.pathname.startsWith("/project/");
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

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

            {(session?.user as any)?.role === "admin" && (
              <Link
                to="/admin"
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  location.pathname.startsWith("/admin")
                    ? "bg-primary-600/20 text-primary-400"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                )}
              >
                <Shield className="w-4 h-4" />
                {t("sidebar.admin")}
              </Link>
            )}
          </nav>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-surface-800 shrink-0">
          {session?.user && (
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-surface-800/40 border border-surface-700/30">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-primary-900/20">
                {session.user.name?.charAt(0).toUpperCase() || session.user.email.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-surface-200 truncate">
                  {session.user.name || t("auth.user")}
                </div>
                <div className="text-[10px] text-surface-500 truncate font-mono">
                  {session.user.email}
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-700 transition-colors"
                  title={t("settings.title")}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-surface-400 hover:text-red-400 hover:bg-surface-700 transition-colors"
                  title={t("auth.logout")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Settings Dialog */}
      {showSettings && (
        <SettingsDialog onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
