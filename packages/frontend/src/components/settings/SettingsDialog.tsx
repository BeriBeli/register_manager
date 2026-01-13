import { X, Moon, Sun, Globe, Info, Lock, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { clsx } from "clsx";
import { useState } from "react";
import { changePassword } from "../../lib/auth-client";

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setPasswordError(error.message || "Failed to change password");
      } else {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-surface-900 border border-surface-800 rounded-xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-800 bg-surface-900 shrink-0">
          <h2 className="text-lg font-medium text-surface-100">{t("settings.title")}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Two Columns */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-64 border-r border-surface-800 p-2 space-y-1 bg-surface-900/50">
            <button
              onClick={() => setActiveTab("general")}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                activeTab === "general"
                  ? "bg-primary-600/20 text-primary-400"
                  : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
              )}
            >
              <Settings className="w-4 h-4" />
              {t("settings.tabs.general")}
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                activeTab === "security"
                  ? "bg-primary-600/20 text-primary-400"
                  : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
              )}
            >
              <Lock className="w-4 h-4" />
              {t("settings.tabs.security")}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-surface-950/30">
            {activeTab === "general" ? (
              <div className="space-y-8 max-w-2xl">
                {/* Theme Section */}
                <section>
                  <h3 className="text-sm font-medium text-surface-400 uppercase mb-4">{t("settings.appearance.title")}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "light", icon: Sun, label: t("settings.appearance.light.title") },
                      { value: "dark", icon: Moon, label: t("settings.appearance.dark.title") },
                      { value: "system", icon: Globe, label: t("settings.appearance.system.title") },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value as any)}
                        className={clsx(
                          "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                          theme === option.value
                            ? "bg-primary-600/10 border-primary-600/50 text-primary-400"
                            : "bg-surface-800/50 border-surface-700 hover:border-surface-600 text-surface-400"
                        )}
                      >
                        <option.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Language Section */}
                <section>
                  <h3 className="text-sm font-medium text-surface-400 uppercase mb-4">{t("settings.language.title")}</h3>
                  <div className="flex gap-3">
                    {['en', 'zh'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => i18n.changeLanguage(lang)}
                        className={clsx(
                          "px-4 py-2 rounded-md border text-sm font-medium transition-colors uppercase",
                          i18n.language === lang
                            ? "bg-primary-600/10 border-primary-600/50 text-primary-400"
                            : "bg-surface-800/50 border-surface-700 hover:border-surface-600 text-surface-400"
                        )}
                      >
                        {lang === 'en' ? 'English' : '中文'}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Info Section */}
                <section className="pt-4 border-t border-surface-800">
                  <div className="flex items-start gap-3 p-3 bg-surface-800/30 rounded-lg">
                    <Info className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-surface-400">
                      <p className="font-medium text-surface-300 mb-1">Register Manager v0.1.0</p>
                      <p>Open source tool for managing hardware registers and generating output files.</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-surface-100">{t("settings.security.title")}</h3>
                  <p className="text-sm text-surface-400">{t("settings.security.description")}</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-surface-300 mb-1.5">{t("settings.security.currentPassword")}</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-surface-800 border-surface-700 rounded-md px-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                      placeholder={t("settings.security.placeholders.current")}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-300 mb-1.5">{t("settings.security.newPassword")}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-surface-800 border-surface-700 rounded-md px-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                      placeholder={t("settings.security.placeholders.new")}
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-300 mb-1.5">{t("settings.security.confirmPassword")}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-surface-800 border-surface-700 rounded-md px-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                      placeholder={t("settings.security.placeholders.confirm")}
                      required
                      minLength={8}
                    />
                  </div>

                  {passwordError && (
                    <div className="text-xs text-red-400 bg-red-900/10 border border-red-900/20 p-3 rounded-md flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="text-xs text-green-400 bg-green-900/10 border border-green-900/20 p-3 rounded-md flex items-start gap-2">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{t("settings.security.messages.success")}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || passwordSuccess}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {loading ? t("settings.security.button.loading") : t("settings.security.button.submit")}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
