import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRegisterStore } from "../../stores/registerStore";
import type { AddressBlock } from "@register-manager/shared";

interface AddressBlockDialogProps {
  memoryMapId?: string;
  initialData?: AddressBlock;
  onClose: (id?: string) => void;
}

export function AddressBlockDialog({ memoryMapId, initialData, onClose }: AddressBlockDialogProps) {
  const { t } = useTranslation();
  const createAddressBlock = useRegisterStore((state) => state.createAddressBlock);
  const updateAddressBlock = useRegisterStore((state) => state.updateAddressBlock);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    baseAddress: "0x00000000",
    range: "0x1000",
    width: "32",
    usage: "register" as "register" | "memory" | "reserved",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        displayName: initialData.displayName || "",
        description: initialData.description || "",
        baseAddress: initialData.baseAddress,
        range: initialData.range,
        width: initialData.width.toString(),
        usage: (initialData.usage as any) || "register",
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = t("project.add_block.errors.name_required");
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = t("project.add_block.errors.name_invalid");
    }

    if (!formData.baseAddress.startsWith("0x")) {
      newErrors.baseAddress = t("project.add_block.errors.base_invalid");
    }

    if (!formData.range.startsWith("0x")) {
      newErrors.range = t("project.add_block.errors.range_invalid");
    }

    const width = parseInt(formData.width);
    if (isNaN(width) || width <= 0) {
      newErrors.width = t("project.add_block.errors.width_invalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEdit && initialData) {
        await updateAddressBlock(initialData.id, {
          name: formData.name,
          displayName: formData.displayName || undefined,
          description: formData.description || undefined,
          baseAddress: formData.baseAddress,
          range: formData.range,
          width: parseInt(formData.width),
          usage: formData.usage,
        });
        onClose(initialData.id);
      } else {
        if (!memoryMapId) {
          console.error("Memory Map ID required for creation");
          return;
        }
        const newId = await createAddressBlock(memoryMapId, {
          name: formData.name,
          displayName: formData.displayName || undefined,
          description: formData.description || undefined,
          baseAddress: formData.baseAddress,
          range: formData.range,
          width: parseInt(formData.width),
          usage: formData.usage,
        });
        onClose(newId);
      }
    } catch (error) {
      console.error("Failed to save address block:", error);
      setErrors({ submit: t("project.add_block.save_failed") });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">
            {isEdit ? t("project.add_block.title_edit") : t("project.add_block.title")}
          </h2>
          <button onClick={() => onClose()} className="btn-ghost p-2" disabled={isLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("common.name")} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder={t("project.add_block.name_placeholder")}
              disabled={isLoading}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("common.display_name")}
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="input"
              placeholder={t("project.add_block.display_name_placeholder")}
              disabled={isLoading}
            />
          </div>

          {/* Base Address & Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.base_address")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.baseAddress}
                onChange={(e) => setFormData({ ...formData, baseAddress: e.target.value })}
                className="input font-mono"
                placeholder={t("project.add_block.base_placeholder")}
                disabled={isLoading}
              />
              {errors.baseAddress && <p className="text-xs text-red-400 mt-1">{errors.baseAddress}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.range")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.range}
                onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                className="input font-mono"
                placeholder={t("project.add_block.range_placeholder")}
                disabled={isLoading}
              />
              {errors.range && <p className="text-xs text-red-400 mt-1">{errors.range}</p>}
            </div>
          </div>

          {/* Width & Usage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.width")} ({t("common.bits")}) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="input"
                disabled={isLoading}
              />
              {errors.width && <p className="text-xs text-red-400 mt-1">{errors.width}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.usage")}
              </label>
              <select
                value={formData.usage}
                onChange={(e) => setFormData({ ...formData, usage: e.target.value as any })}
                className="input"
                disabled={isLoading}
              >
                <option value="register">Register</option>
                <option value="memory">Memory</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("common.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[60px]"
              placeholder={t("project.add_block.desc_placeholder")}
              disabled={isLoading}
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-400">
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-surface-700">
          <button type="button" onClick={() => onClose()} className="btn-secondary" disabled={isLoading}>
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
            {isLoading
              ? (isEdit ? t("project.add_block.saving") : t("project.add_block.creating"))
              : (isEdit ? t("project.add_block.submit_save") : t("project.add_block.submit"))}
          </button>
        </div>
      </div>
    </div>
  );
}
