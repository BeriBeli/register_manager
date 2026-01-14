import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRegisterStore } from "../../stores/registerStore";
import type { CreateFieldInput } from "@register-manager/shared";

interface FieldDialogProps {
  registerId: string;
  registerSize: number;
  initialBitOffset?: number;
  initialBitWidth?: number;
  onClose: () => void;
}

export function FieldDialog({ registerId, registerSize, initialBitOffset = 0, initialBitWidth = 1, onClose }: FieldDialogProps) {
  const { t } = useTranslation();
  const createField = useRegisterStore((state) => state.createField);
  const validateBitFieldConflict = useRegisterStore((state) => state.validateBitFieldConflict);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const [formData, setFormData] = useState<CreateFieldInput>({
    name: "",
    displayName: "",
    description: "",
    bitOffset: initialBitOffset,
    bitWidth: initialBitWidth,
    volatile: false,
    access: "read-write",
    resetValue: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("project.create_field.errors.name_required");
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = t("project.create_field.errors.name_invalid");
    }

    if (formData.bitOffset < 0 || formData.bitOffset >= registerSize) {
      newErrors.bitOffset = t("project.create_field.errors.offset_range", { max: registerSize - 1 });
    }

    if (formData.bitWidth <= 0 || formData.bitWidth > registerSize) {
      newErrors.bitWidth = t("project.create_field.errors.width_range", { max: registerSize });
    }

    if (formData.bitOffset + formData.bitWidth > registerSize) {
      newErrors.bitWidth = t("project.create_field.errors.exceeds_size", { size: registerSize });
    }

    // Check for bit field conflicts
    const tempField = {
      id: "temp",
      ...formData,
      registerId,
      registerType: "register" as const,
      access: "read-write",
      resets: [],
      enumeratedValues: undefined,
      accessPolicies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any; // Type assertion for validation only

    if (validateBitFieldConflict(tempField, registerId)) {
      newErrors.bitOffset = t("project.create_field.errors.overlap");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await createField(registerId, formData);
      onClose();
    } catch (error) {
      console.error("Failed to create field:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">{t("project.create_field.title")}</h2>
          <button
            onClick={onClose}
            className="btn-ghost p-2"
            disabled={isLoading}
          >
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
              placeholder={t("project.create_field.name_placeholder")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
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
              placeholder={t("project.create_field.display_name_placeholder")}
              disabled={isLoading}
            />
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
              placeholder={t("project.create_field.desc_placeholder")}
              disabled={isLoading}
            />
          </div>

          {/* Bit Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.bit_offset")} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.bitOffset}
                onChange={(e) => setFormData({ ...formData, bitOffset: parseInt(e.target.value) || 0 })}
                className="input font-mono"
                min={0}
                max={registerSize - 1}
                disabled={isLoading}
              />
              {errors.bitOffset && (
                <p className="text-xs text-red-400 mt-1">{errors.bitOffset}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.bit_width")} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.bitWidth}
                onChange={(e) => setFormData({ ...formData, bitWidth: parseInt(e.target.value) || 1 })}
                className="input font-mono"
                min={1}
                max={registerSize}
                disabled={isLoading}
              />
              {errors.bitWidth && (
                <p className="text-xs text-red-400 mt-1">{errors.bitWidth}</p>
              )}
            </div>
          </div>

          {/* Bit Range Preview */}
          <div className="p-3 bg-surface-800 rounded border border-surface-700">
            <div className="text-xs text-surface-400 mb-1">{t("project.create_field.bit_range")}</div>
            <div className="font-mono text-primary-400">
              [{formData.bitOffset + formData.bitWidth - 1}:{formData.bitOffset}]
            </div>
          </div>

          {/* Volatile & Access */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                {t("common.access")}
              </label>
              <select
                value={formData.access || "read-write"}
                onChange={(e) => setFormData({ ...formData, access: e.target.value as any })}
                className="input"
                disabled={isLoading}
              >
                <option value="read-write">Read-Write (RW)</option>
                <option value="read-only">Read-Only (RO)</option>
                <option value="write-only">Write-Only (WO)</option>
                <option value="read-writeOnce">Read-WriteOnce (RW1)</option>
                <option value="writeOnce">WriteOnce (W1)</option>
              </select>
            </div>

            <div className="flex pt-8">
              <input
                type="checkbox"
                id="field-volatile"
                checked={formData.volatile}
                onChange={(e) => setFormData({ ...formData, volatile: e.target.checked })}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="field-volatile" className="ml-2 text-sm text-surface-300">
                {t("common.volatile")}
              </label>
            </div>
          </div>

          {/* Reset Value */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              {t("common.reset_value")} ({t("common.hex_format")})
            </label>
            <input
              type="text"
              value={formData.resetValue || ""}
              onChange={(e) => setFormData({ ...formData, resetValue: e.target.value })}
              className="input font-mono"
              placeholder={t("project.create_field.reset_placeholder")}
              disabled={isLoading}
            />
            <p className="text-xs text-surface-500 mt-1">{t("common.optional")}. {t("common.default_unknown")}.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-surface-700">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? t("project.create_field.creating") : t("project.create_field.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
