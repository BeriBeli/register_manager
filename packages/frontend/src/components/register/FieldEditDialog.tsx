import { useState } from "react";
import { X } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";
import type { Field, UpdateFieldInput } from "@register-manager/shared";
import { getFieldAccess } from "@register-manager/shared";

interface FieldEditDialogProps {
  field: Field;
  registerSize: number;
  onClose: () => void;
}

export function FieldEditDialog({ field, registerSize, onClose }: FieldEditDialogProps) {
  const updateField = useRegisterStore((state) => state.updateField);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const [formData, setFormData] = useState<UpdateFieldInput>({
    name: field.name,
    displayName: field.displayName || "",
    description: field.description || "",
    bitOffset: field.bitOffset,
    bitWidth: field.bitWidth,
    volatile: field.volatile,
    access: getFieldAccess(field),
    resetValue: field.resets?.[0]?.value || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = "Name must be a valid identifier";
    }

    if (formData.bitOffset !== undefined) {
      if (formData.bitOffset < 0 || formData.bitOffset >= registerSize) {
        newErrors.bitOffset = `Bit offset must be between 0 and ${registerSize - 1}`;
      }
    }

    if (formData.bitWidth !== undefined) {
      if (formData.bitWidth <= 0 || formData.bitWidth > registerSize) {
        newErrors.bitWidth = `Bit width must be between 1 and ${registerSize}`;
      }

      const offset = formData.bitOffset ?? field.bitOffset;
      const width = formData.bitWidth;
      if (offset + width > registerSize) {
        newErrors.bitWidth = `Field exceeds register size (${registerSize} bits)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await updateField(field.id, formData);
      onClose();
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  const currentOffset = formData.bitOffset ?? field.bitOffset;
  const currentWidth = formData.bitWidth ?? field.bitWidth;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">Edit Field: {field.name}</h2>
          <button onClick={onClose} className="btn-ghost p-2" disabled={isLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., ENABLE, MODE, STATUS"
              disabled={isLoading}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName || ""}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="input"
              placeholder="e.g., Enable Bit"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Describe the purpose of this field..."
              disabled={isLoading}
            />
          </div>

          {/* Bit Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Bit Offset
              </label>
              <input
                type="number"
                value={formData.bitOffset ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, bitOffset: parseInt(e.target.value) || 0 })
                }
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
                Bit Width
              </label>
              <input
                type="number"
                value={formData.bitWidth ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, bitWidth: parseInt(e.target.value) || 1 })
                }
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
            <div className="text-xs text-surface-400 mb-1">Bit Range</div>
            <div className="font-mono text-primary-400">
              [{currentOffset + currentWidth - 1}:{currentOffset}]
            </div>
          </div>

          {/* Volatile & Access */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Access Type
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
                id="edit-field-volatile"
                checked={formData.volatile ?? field.volatile}
                onChange={(e) => setFormData({ ...formData, volatile: e.target.checked })}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="edit-field-volatile" className="ml-2 text-sm text-surface-300">
                Volatile
              </label>
            </div>
          </div>

          {/* Reset Value */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Reset Value (Hex)
            </label>
            <input
              type="text"
              value={formData.resetValue || ""}
              onChange={(e) => setFormData({ ...formData, resetValue: e.target.value })}
              className="input font-mono"
              placeholder="e.g. 0x0"
              disabled={isLoading}
            />
            <p className="text-xs text-surface-500 mt-1">Optional. Default is unknown/undefined.</p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-surface-700">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
