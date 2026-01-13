import { X, Moon, Sun, Globe, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../stores/themeStore";
import { clsx } from "clsx";
import { useState } from "react";

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'appearance' | 'language' | 'about'>('appearance');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-[2px] p-4">
      {/* 
        Main Container: 
        - Default large size (w-[900px], h-[600px])
        - Min dimensions to prevent breaking
        - `resize` class for user resizing
      */}
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden resize-both min-w-[640px] min-h-[480px] w-[900px] h-[600px] max-w-[95vw] max-h-[95vh] relative text-surface-200">

        {/* Sidebar */}
        <div className="w-full md:w-56 bg-surface-950/50 border-b md:border-b-0 md:border-r border-surface-700/50 flex flex-row md:flex-col shrink-0">
          <div className="p-4 md:p-6 shrink-0">
            <h2 className="text-lg font-semibold text-surface-100 tracking-tight">{t('settings.title')}</h2>
            <p className="text-xs text-surface-500 mt-1">{t('settings.subtitle')}</p>
          </div>

          <div className="flex-1 overflow-x-auto md:overflow-visible flex flex-row md:flex-col gap-1 px-3 pb-3">
            <button
              onClick={() => setActiveTab('appearance')}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === 'appearance'
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent"
              )}
            >
              <Sun className="w-4 h-4" />
              <span>{t('settings.tabs.appearance')}</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === 'language'
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent"
              )}
            >
              <Globe className="w-4 h-4" />
              <span>{t('settings.tabs.language')}</span>
            </button>

            <div className="flex-1 hidden md:block" />

            <button
              onClick={() => setActiveTab('about')}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all md:mt-auto",
                activeTab === 'about'
                  ? "bg-surface-800 text-surface-100 border border-surface-700"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent"
              )}
            >
              <Info className="w-4 h-4" />
              <span>{t('settings.tabs.about')}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface-900/50 relative">

          {/* Close Button / Header */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 text-surface-400 hover:text-surface-100 bg-surface-800/50 hover:bg-surface-800 rounded-lg transition-colors border border-transparent hover:border-surface-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'appearance' && (
              <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-medium text-surface-100 mb-2">{t('settings.appearance.title')}</h3>
                  <p className="text-surface-400 mb-6">{t('settings.appearance.description')}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={clsx(
                        "group relative p-4 rounded-xl border-2 transition-all flex flex-col items-start gap-4 text-left overflow-hidden bg-white",
                        theme === 'light'
                          ? "border-primary-500 shadow-xl shadow-primary-900/10 ring-1 ring-primary-500"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="w-full h-24 rounded-lg bg-slate-50 border border-slate-200 relative overflow-hidden group-hover:scale-[1.02] transition-transform origin-top">
                        <div className="absolute top-2 left-2 w-16 h-8 bg-white rounded shadow-sm border border-slate-100" />
                        <div className="absolute top-12 left-2 right-2 h-2 bg-slate-200 rounded-full" />
                        <div className="absolute top-16 left-2 right-8 h-2 bg-slate-200 rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Sun className={clsx("w-4 h-4", theme === 'light' ? "text-primary-600" : "text-slate-500")} />
                          <span className={clsx("font-medium", theme === 'light' ? "text-primary-600" : "text-slate-700")}>{t('settings.appearance.light.title')}</span>
                        </div>
                        <p className="text-xs text-slate-500">{t('settings.appearance.light.description')}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={clsx(
                        "group relative p-4 rounded-xl border-2 transition-all flex flex-col items-start gap-4 text-left overflow-hidden bg-slate-950",
                        theme === 'dark'
                          ? "border-primary-500 shadow-xl shadow-primary-900/10 ring-1 ring-primary-500"
                          : "border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <div className="w-full h-24 rounded-lg bg-slate-900 border border-slate-800 relative overflow-hidden group-hover:scale-[1.02] transition-transform origin-top">
                        <div className="absolute top-2 left-2 w-16 h-8 bg-slate-800 rounded border border-slate-700" />
                        <div className="absolute top-12 left-2 right-2 h-2 bg-slate-800 rounded-full" />
                        <div className="absolute top-16 left-2 right-8 h-2 bg-slate-800 rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Moon className={clsx("w-4 h-4", theme === 'dark' ? "text-primary-400 border border-slate-700" : "text-slate-400")} />
                          <span className={clsx("font-medium", theme === 'dark' ? "text-primary-400" : "text-slate-200")}>{t('settings.appearance.dark.title')}</span>
                        </div>
                        <p className="text-xs text-slate-400">{t('settings.appearance.dark.description')}</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="text-xl font-medium text-surface-100 mb-2">{t('settings.language.title')}</h3>
                  <p className="text-surface-400 mb-6">{t('settings.language.description')}</p>

                  <div className="space-y-3">
                    <button
                      onClick={() => i18n.changeLanguage('en')}
                      className={clsx(
                        "w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all group",
                        i18n.language.startsWith('en')
                          ? "border-primary-500 bg-surface-800 shadow-lg shadow-black/20"
                          : "border-surface-700 bg-surface-800/30 hover:border-surface-600 hover:bg-surface-800"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-lg shadow-inner">🇺🇸</div>
                        <div>
                          <div className={clsx("font-medium", i18n.language.startsWith('en') ? "text-primary-400" : "text-surface-200")}>{t('settings.language.en.title')}</div>
                          <div className="text-xs text-surface-500">{t('settings.language.en.subtitle')}</div>
                        </div>
                      </div>
                      {i18n.language.startsWith('en') && <div className="w-3 h-3 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />}
                    </button>

                    <button
                      onClick={() => i18n.changeLanguage('zh')}
                      className={clsx(
                        "w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all group",
                        i18n.language.startsWith('zh')
                          ? "border-primary-500 bg-surface-800 shadow-lg shadow-black/20"
                          : "border-surface-700 bg-surface-800/30 hover:border-surface-600 hover:bg-surface-800"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-lg shadow-inner">🇨🇳</div>
                        <div>
                          <div className={clsx("font-medium", i18n.language.startsWith('zh') ? "text-primary-400" : "text-surface-200")}>{t('settings.language.zh.title')}</div>
                          <div className="text-xs text-surface-500">{t('settings.language.zh.subtitle')}</div>
                        </div>
                      </div>
                      {i18n.language.startsWith('zh') && <div className="w-3 h-3 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-8">
                  <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-900/50 shrink-0 transform rotate-3">
                    <span className="font-bold text-white text-5xl">R</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-surface-100 tracking-tight">Register Manager</h3>
                    <p className="text-primary-400 font-mono text-sm mt-1 mb-4">{t('sidebar.version')} 1.0.0 (Beta)</p>
                    <p className="text-surface-300 leading-relaxed mb-6">
                      {t('settings.about.description')}
                    </p>

                    <div className="flex gap-4">
                      <button className="btn-secondary text-xs py-1.5 px-3">{t('settings.about.check_updates')}</button>
                      <button className="btn-ghost text-xs py-1.5 px-3">{t('settings.about.report_issue')}</button>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-surface-700/50 grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-semibold text-surface-200 mb-3">{t('settings.about.core_frameworks')}</h4>
                    <ul className="space-y-2 text-sm text-surface-500">
                      <li>React 18</li>
                      <li>Tailwind CSS</li>
                      <li>Zustand</li>
                      <li>Vite</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-surface-200 mb-3">{t('settings.about.legal')}</h4>
                    <ul className="space-y-2 text-sm text-surface-500">
                      <li className="hover:text-primary-400 cursor-pointer transition-colors">{t('settings.about.privacy')}</li>
                      <li className="hover:text-primary-400 cursor-pointer transition-colors">{t('settings.about.terms')}</li>
                      <li className="hover:text-primary-400 cursor-pointer transition-colors">{t('settings.about.licenses')}</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-12 text-center text-xs text-surface-600">
                  {t('settings.about.footer')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
