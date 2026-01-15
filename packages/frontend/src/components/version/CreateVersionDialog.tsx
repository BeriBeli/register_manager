import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface CreateVersionDialogProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateVersionDialog({ projectId, onClose, onSuccess }: CreateVersionDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: async (data: { version: string; description: string }) => {
      const res = await fetchWithAuth(`/api/projects/versions/${projectId}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create version");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-versions", projectId] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const { register, handleSubmit } = useForm<{ version: string; description: string }>();

  const onSubmit = (data: { version: string; description: string }) => {
    createMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-surface-100">{t("versions.create_modal.title")}</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-300 uppercase tracking-wider">
              {t("versions.name")}
            </label>
            <input
              {...register("version", { required: true })}
              className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              placeholder={t("versions.create_modal.name_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-surface-300 uppercase tracking-wider">
              {t("versions.description")}
            </label>
            <textarea
              {...register("description")}
              className="w-full bg-surface-950 border border-surface-700 rounded-lg px-3 py-2 text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all min-h-[80px]"
              placeholder={t("versions.create_modal.desc_placeholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-surface-300 hover:bg-surface-800 transition-colors"
            >
              {t("versions.create_modal.cancel")}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-500 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending ? t("versions.create_modal.creating") : t("versions.create_modal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
