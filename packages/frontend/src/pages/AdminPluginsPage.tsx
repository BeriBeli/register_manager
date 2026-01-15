import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Trash2, AlertCircle, FileCode, Clock } from "lucide-react";
import { ImportPlugin } from "@register-manager/shared";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { UploadPluginDialog } from "../components/admin/UploadPluginDialog";

export function AdminPluginsPage() {
  const { t } = useTranslation();
  const [plugins, setPlugins] = useState<ImportPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletePlugin, setDeletePlugin] = useState<ImportPlugin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/plugins", { credentials: "include" });
      const result = await response.json();

      if (response.ok) {
        setPlugins(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch plugins");
      }
    } catch (err: any) {
      setError(err.message || t("admin.plugins.messages.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleDeleteClick = (plugin: ImportPlugin) => {
    setDeletePlugin(plugin);
  };

  const handleConfirmDelete = async () => {
    if (!deletePlugin) return;
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/plugins/${deletePlugin.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setPlugins(plugins.filter(p => p.id !== deletePlugin.id));
        setDeletePlugin(null);
      } else {
        // Error: dialog stays open as feedback
      }
    } catch {
      // Error: dialog stays open as feedback
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-surface-400">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      <ConfirmDialog
        isOpen={!!deletePlugin}
        onClose={() => setDeletePlugin(null)}
        onConfirm={handleConfirmDelete}
        title={t("admin.plugins.actions.delete")}
        description={t("admin.plugins.messages.confirmDelete", { name: deletePlugin?.name })}
        confirmText={t("admin.plugins.actions.delete")}
        isLoading={deleteLoading}
        variant="danger"
      />

      {showUploadDialog && (
        <UploadPluginDialog
          onClose={() => setShowUploadDialog(false)}
          onSuccess={fetchPlugins}
        />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50 mb-2">{t("admin.plugins.title")}</h1>
          <p className="text-surface-400">{t("admin.plugins.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowUploadDialog(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {t("admin.plugins.actions.upload")}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-900/20 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-surface-900 border border-surface-800 rounded-lg overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-800/50 text-surface-400 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">{t("admin.plugins.table.name")}</th>
              <th className="px-6 py-4">{t("admin.plugins.table.description")}</th>
              <th className="px-6 py-4">{t("admin.plugins.table.type")}</th>
              <th className="px-6 py-4">{t("admin.plugins.table.extensions")}</th>
              <th className="px-6 py-4 text-right">{t("admin.plugins.table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {plugins.map((plugin) => (
              <tr key={plugin.id} className="hover:bg-surface-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-surface-100">{plugin.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-surface-400 max-w-xs truncate">
                  {plugin.description || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-800 text-surface-300 border border-surface-700">
                    {plugin.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {plugin.supportedExtensions.map((ext) => (
                      <span key={ext} className="px-2 py-0.5 rounded-md bg-surface-800 text-surface-400 text-xs border border-surface-700">
                        {ext}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteClick(plugin)}
                    className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                    title={t("admin.plugins.actions.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {plugins.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-surface-500">
                  {t("admin.plugins.messages.noPlugins")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
