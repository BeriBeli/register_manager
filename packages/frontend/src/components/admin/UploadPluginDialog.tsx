import { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ImportPlugin } from "@register-manager/shared";

interface UploadPluginDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadPluginDialog({ onClose, onSuccess }: UploadPluginDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        setError(t("admin.plugins.errors.invalid_extension"));
        return;
      }

      setFile(selectedFile);
      setError(null);

      // Auto-fill name if empty
      if (!name) {
        setName(selectedFile.name.replace(".zip", ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("description", description);

      const response = await fetch("/api/plugins", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload plugin");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-surface-100">
            {t("admin.plugins.upload_title")}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("admin.plugins.fields.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="e.g. My Custom Parser"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("admin.plugins.fields.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Optional description..."
            />
          </div>

          {/* File Upload (ZIP) */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Plugin Package (.zip)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${file
                ? "border-primary-500 bg-primary-500/5"
                : "border-surface-700 hover:border-surface-600"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-primary-400">
                  <FileCode className="w-5 h-5" />
                  <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                </div>
              ) : (
                <div className="text-surface-500">
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">{t("admin.plugins.click_upload")}</span>
                  <div className="text-xs mt-1 text-surface-600">Upload plugin release package (.zip)</div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !file || !name}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("common.save")}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}
