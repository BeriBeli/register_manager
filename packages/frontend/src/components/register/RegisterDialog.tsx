import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";
import type { CreateRegisterInput, Register } from "@register-manager/shared";

interface RegisterDialogProps {
  addressBlockId: string;
  onClose: () => void;
  editingRegister?: Register | null;
}

export function RegisterDialog({ addressBlockId, onClose, editingRegister }: RegisterDialogProps) {
  const createRegister = useRegisterStore((state) => state.createRegister);
  const updateRegister = useRegisterStore((state) => state.updateRegister);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const [formData, setFormData] = useState<CreateRegisterInput>({
    name: "",
    displayName: "",
    description: "",
    addressOffset: "0x00",
    size: 32,
    volatile: false,
  });

  useEffect(() => {
    if (editingRegister) {
      setFormData({
        name: editingRegister.name,
        displayName: editingRegister.displayName || "",
        description: editingRegister.description || "",
        addressOffset: editingRegister.addressOffset,
        size: editingRegister.size,
        volatile: editingRegister.volatile || false,
      });
    }
  }, [editingRegister]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = "Name must be a valid identifier";
    }

    if (!formData.addressOffset.trim()) {
      newErrors.addressOffset = "Address offset is required";
    } else if (!/^(0x)?[0-9a-fA-F]+$/.test(formData.addressOffset)) {
      newErrors.addressOffset = "Invalid hex address";
    }

    if (formData.size <= 0 || formData.size > 1024) {
      newErrors.size = "Size must be between 1 and 1024 bits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (editingRegister) {
        await updateRegister(editingRegister.id, formData);
      } else {
        await createRegister(addressBlockId, formData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save register:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">
            {editingRegister ? "Edit Register" : "Create New Register"}
          </h2>
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
              placeholder="e.g., CTRL, STATUS, CONFIG"
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
              placeholder="e.g., Control Register"
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
              className="input min-h-[80px]"
              placeholder="Describe the purpose of this register..."
              disabled={isLoading}
            />
          </div>

          {/* Address Offset */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Address Offset <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.addressOffset}
              onChange={(e) => setFormData({ ...formData, addressOffset: e.target.value })}
              className="input font-mono"
              placeholder="0x00"
              disabled={isLoading}
            />
            {errors.addressOffset && (
              <p className="text-xs text-red-400 mt-1">{errors.addressOffset}</p>
            )}
            <p className="text-xs text-surface-500 mt-1">
              Hex format (e.g., 0x00, 0x04, 0x100)
            </p>
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Size (bits) <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
              className="input"
              disabled={isLoading}
            >
              <option value={8}>8 bits</option>
              <option value={16}>16 bits</option>
              <option value={32}>32 bits</option>
              <option value={64}>64 bits</option>
              <option value={128}>128 bits</option>
            </select>
            {errors.size && (
              <p className="text-xs text-red-400 mt-1">{errors.size}</p>
            )}
          </div>

          {/* Volatile */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="volatile"
              checked={formData.volatile}
              onChange={(e) => setFormData({ ...formData, volatile: e.target.checked })}
              className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-600 focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            />
            <label htmlFor="volatile" className="text-sm text-surface-300">
              Volatile (value may change without software intervention)
            </label>
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
            {isLoading
              ? "Saving..."
              : editingRegister
                ? "Save Changes"
                : "Create Register"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
