import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCw, Plus, History as HistoryIcon, User as UserIcon, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

interface ProjectVersion {
  id: string;
  projectId: string;
  version: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  resultCreator?: {
    name: string;
    email: string;
  };
}

export function ProjectVersions() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<ProjectVersion | null>(null);

  // API Client
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const fetchWithAuth = async (path: string, options: RequestInit = {}) => {
    return fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include", // Send cookies
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  };

  // Queries
  const { data: versions, isLoading, error } = useQuery({
    queryKey: ["project-versions", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetchWithAuth(`/api/projects/versions/${id}`);
      if (!res.ok) throw new Error("Failed to load versions");
      const json = await res.json() as { data: ProjectVersion[] };
      return json.data;
    },
    enabled: !!id,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: { version: string; description: string }) => {
      const res = await fetchWithAuth(`/api/projects/versions/${id}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-versions", id] });
      setCreateOpen(false);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetchWithAuth(`/api/projects/versions/${id}/${versionId}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restore version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-versions", id] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setVersionToRestore(null);
      alert(t("versions.success_restore") || "Version restored");
    },
  });

  // Form for create
  const { register, handleSubmit, reset } = useForm<{ version: string; description: string }>();

  const onSubmitCreate = (data: { version: string; description: string }) => {
    createMutation.mutate(data);
    reset();
  };

  if (isLoading) return <div className="p-8 text-center text-surface-400">{t("versions.loading")}</div>;
  if (error) return <div className="p-8 text-center text-red-400">{t("versions.error_load")}</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-950">
      <ConfirmDialog
        isOpen={!!versionToRestore}
        onClose={() => setVersionToRestore(null)}
        onConfirm={() => versionToRestore && restoreMutation.mutate(versionToRestore.id)}
        title={t("versions.restore_modal.title")}
        description={`${t("versions.restore_modal.warning")} ${versionToRestore ? `(${versionToRestore.version})` : ""}`}
        confirmText={t("versions.restore_modal.confirm")}
        isLoading={restoreMutation.isPending}
        variant="warning"
      />

      {/* Header */}
      <div className="h-14 border-b border-surface-800 flex items-center justify-between px-6 bg-surface-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold text-surface-100">{t("versions.title")}</h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t("versions.create")}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {versions?.map((version) => (
            <div
              key={version.id}
              className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 hover:border-surface-700 transition-colors shadow-sm"
            >
              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-surface-100">{version.version}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-800 text-surface-400 border border-surface-700 font-mono">
                    {version.id.slice(0, 8)}
                  </span>
                </div>
                {version.description && (
                  <p className="text-sm text-surface-400">{version.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-surface-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(version.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    {version.resultCreator?.name || version.resultCreator?.email || t("versions.unknown_user")}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setVersionToRestore(version)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-surface-700 text-surface-300 hover:text-surface-100 hover:bg-surface-800 hover:border-surface-600 transition-all text-sm group"
                  title={t("versions.restore")}
                >
                  <RotateCw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                  {t("versions.restore")}
                </button>
              </div>
            </div>
          ))}

          {versions?.length === 0 && (
            <div className="text-center py-12 text-surface-500 border-2 border-dashed border-surface-800 rounded-xl">
              <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t("versions.empty_state")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-surface-100">{t("versions.create_modal.title")}</h3>
              <button onClick={() => setCreateOpen(false)} className="text-surface-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmitCreate)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-300 uppercase tracking-wider">{t("versions.name")}</label>
                <input
                  {...register("version", { required: true })}
                  className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                  placeholder={t("versions.create_modal.name_placeholder")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-surface-300 uppercase tracking-wider">{t("versions.description")}</label>
                <textarea
                  {...register("description")}
                  className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all min-h-[80px]"
                  placeholder={t("versions.create_modal.desc_placeholder")}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-surface-300 hover:bg-surface-800 transition-colors"
                >
                  {t("versions.create_modal.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? t("versions.create_modal.creating") : t("versions.create_modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
