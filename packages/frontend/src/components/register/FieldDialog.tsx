import { useState } from "react";
import { X } from "lucide-react";
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
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = "Name must be a valid identifier";
    }

    if (formData.bitOffset < 0 || formData.bitOffset >= registerSize) {
      newErrors.bitOffset = `Bit offset must be between 0 and ${registerSize - 1}`;
    }

    if (formData.bitWidth <= 0 || formData.bitWidth > registerSize) {
      newErrors.bitWidth = `Bit width must be between 1 and ${registerSize}`;
    }

    if (formData.bitOffset + formData.bitWidth > registerSize) {
      newErrors.bitWidth = `Field exceeds register size (${registerSize} bits)`;
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
      newErrors.bitOffset = "Bit field overlaps with existing field";
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
          <h2 className="text-lg font-semibold text-surface-100">Create New Field</h2>
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
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., ENABLE, MODE, STATUS"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
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
              value={formData.description}
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
                Bit Offset <span className="text-red-400">*</span>
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
                Bit Width <span className="text-red-400">*</span>
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
            <div className="text-xs text-surface-400 mb-1">Bit Range</div>
            <div className="font-mono text-primary-400">
              [{formData.bitOffset + formData.bitWidth - 1}:{formData.bitOffset}]
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
                id="field-volatile"
                checked={formData.volatile}
                onChange={(e) => setFormData({ ...formData, volatile: e.target.checked })}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="field-volatile" className="ml-2 text-sm text-surface-300">
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
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Field"}
          </button>
        </div>
      </div>
    </div>
  );
}
