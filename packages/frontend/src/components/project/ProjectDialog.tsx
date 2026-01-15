import { useState } from "react";
import { X } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ProjectDialogProps {
  onClose: () => void;
}

export function ProjectDialog({ onClose }: ProjectDialogProps) {
  const { t } = useTranslation();
  const createProject = useRegisterStore((state) => state.createProject);
  const isLoading = useRegisterStore((state) => state.isLoading);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    vendor: "mycompany",
    library: "ip",
    version: "1.0",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = t("project.create_dialog.errors.name_required");
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = t("project.create_dialog.errors.name_invalid");
    }

    if (!formData.vendor) {
      newErrors.vendor = t("project.create_dialog.errors.vendor_required");
    }

    if (!formData.library) {
      newErrors.library = t("project.create_dialog.errors.library_required");
    }

    if (!formData.version) {
      newErrors.version = t("project.create_dialog.errors.version_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createProject({
        name: formData.name,
        displayName: formData.displayName || undefined,
        description: formData.description || undefined,
        vlnv: {
          vendor: formData.vendor,
          library: formData.library,
          name: formData.name,
          version: formData.version,
        },
      });

      // Close dialog and let the user navigate from dashboard
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      setErrors({ submit: t("project.create_dialog.errors.submit_failed") });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">{t("project.create_dialog.title")}</h2>
          <button onClick={onClose} className="btn-ghost p-2" disabled={isLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("project.create_dialog.project_name")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder={t("project.create_dialog.placeholders.project_name")}
              disabled={isLoading}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            <p className="text-xs text-surface-500 mt-1">
              {t("project.create_dialog.hints.name_identifier")}
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("project.create_dialog.display_name")}
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="input"
              placeholder={t("project.create_dialog.placeholders.display_name")}
              disabled={isLoading}
            />
            <p className="text-xs text-surface-500 mt-1">{t("project.create_dialog.hints.display_name_optional")}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("project.create_dialog.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px]"
              placeholder={t("project.create_dialog.placeholders.description")}
              disabled={isLoading}
            />
          </div>

          {/* VLNV */}
          <div className="border-t border-surface-700 pt-4">
            <h3 className="text-sm font-medium text-surface-300 mb-3">
              {t("project.create_dialog.vlnv_identifier")}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t("project.create_dialog.vendor")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="input text-sm"
                  placeholder={t("project.create_dialog.placeholders.vendor")}
                  disabled={isLoading}
                />
                {errors.vendor && <p className="text-xs text-red-400 mt-1">{errors.vendor}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t("project.create_dialog.library")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.library}
                  onChange={(e) => setFormData({ ...formData, library: e.target.value })}
                  className="input text-sm"
                  placeholder={t("project.create_dialog.placeholders.library")}
                  disabled={isLoading}
                />
                {errors.library && <p className="text-xs text-red-400 mt-1">{errors.library}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t("project.create_dialog.version")} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="input text-sm"
                  placeholder={t("project.create_dialog.placeholders.version")}
                  disabled={isLoading}
                />
                {errors.version && <p className="text-xs text-red-400 mt-1">{errors.version}</p>}
              </div>
            </div>

            <div className="mt-3 p-3 bg-surface-800 rounded border border-surface-700">
              <div className="text-xs text-surface-400 mb-1">{t("project.create_dialog.full_vlnv")}</div>
              <div className="font-mono text-sm text-primary-400">
                {formData.vendor || "vendor"}:{formData.library || "library"}:
                {formData.name || "name"}:{formData.version || "version"}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-400">
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-surface-700">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
            {t("project.create_dialog.cancel")}
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
            {isLoading ? t("project.create_dialog.creating") : t("project.create_dialog.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
