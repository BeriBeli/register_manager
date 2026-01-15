import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Cpu, FileCode, BookOpen, ChevronLeft, Sun, Moon, Globe, LogOut, User, Settings, Shield, History } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { ProjectTree } from "./ProjectTree";
import { SettingsDialog } from "../settings/SettingsDialog";
import { ConfirmDialog } from "../common/ConfirmDialog";
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Extract projectId if in project view
  const projectId = isProjectView ? location.pathname.split("/")[2] : null;

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    await signOut();
    navigate("/auth");
    setShowLogoutConfirm(false);
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
            <div className="p-3 border-b border-surface-800 space-y-3">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('sidebar.back_to_projects')}
              </Link>

              {projectId && (
                <div className="flex gap-1 bg-surface-800/50 p-1 rounded-lg">
                  <Link
                    to={`/project/${projectId}`}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors",
                      location.pathname === `/project/${projectId}`
                        ? "bg-surface-700 text-surface-100 shadow-sm"
                        : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
                    )}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {t('sidebar.editor')}
                  </Link>
                  <Link
                    to={`/project/${projectId}/versions`}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-colors",
                      location.pathname.includes("/versions")
                        ? "bg-surface-700 text-surface-100 shadow-sm"
                        : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
                    )}
                  >
                    <History className="w-3.5 h-3.5" />
                    {t('sidebar.history')}
                  </Link>
                </div>
              )}
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

            {/* Admin Navigation */}
            {(session?.user as any)?.role === "admin" && (
              <>
                <div className="mt-4 px-3 mb-2 text-xs font-semibold text-surface-500 uppercase">
                  {t("sidebar.admin")}
                </div>
                {[
                  { name: "Users", href: "/admin/users", icon: User },
                  { name: "Plugins", href: "/admin/plugins", icon: FileCode }
                ].map((item) => {
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
              </>
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
                {/* Admin link removed as it's now in the main navigation */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-700 transition-colors"
                  title={t("settings.title")}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogoutClick}
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

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title={t("auth.confirm_logout.title")}
        description={t("auth.confirm_logout.description")}
        confirmText={t("auth.logout")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </>
  );
}
