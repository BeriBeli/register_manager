import { useState } from "react";
import { X } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";

interface CreateAddressBlockDialogProps {
  memoryMapId: string;
  onClose: (id?: string) => void;
}

export function CreateAddressBlockDialog({ memoryMapId, onClose }: CreateAddressBlockDialogProps) {
  const createAddressBlock = useRegisterStore((state) => state.createAddressBlock);
  const isLoading = useRegisterStore((state) => state.isLoading);

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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = "Name must be a valid identifier";
    }

    if (!formData.baseAddress.startsWith("0x")) {
      newErrors.baseAddress = "Base address must start with 0x";
    }

    if (!formData.range.startsWith("0x")) {
      newErrors.range = "Range must start with 0x";
    }

    const width = parseInt(formData.width);
    if (isNaN(width) || width <= 0) {
      newErrors.width = "Width must be a positive integer";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
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
    } catch (error) {
      console.error("Failed to create address block:", error);
      setErrors({ submit: "Failed to create address block. Please try again." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">Add Address Block</h2>
          <button onClick={() => onClose()} className="btn-ghost p-2" disabled={isLoading}>
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
              placeholder="e.g., ctrl_regs"
              disabled={isLoading}
              autoFocus
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
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="input"
              placeholder="e.g., Control Registers"
              disabled={isLoading}
            />
          </div>

          {/* Base Address & Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Base Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.baseAddress}
                onChange={(e) => setFormData({ ...formData, baseAddress: e.target.value })}
                className="input font-mono"
                placeholder="0x1000"
                disabled={isLoading}
              />
              {errors.baseAddress && <p className="text-xs text-red-400 mt-1">{errors.baseAddress}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Range <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.range}
                onChange={(e) => setFormData({ ...formData, range: e.target.value })}
                className="input font-mono"
                placeholder="0x100"
                disabled={isLoading}
              />
              {errors.range && <p className="text-xs text-red-400 mt-1">{errors.range}</p>}
            </div>
          </div>

          {/* Width & Usage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1">
                Width (bits) <span className="text-red-400">*</span>
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
                Usage
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[60px]"
              placeholder="Block description..."
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
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Block"}
          </button>
        </div>
      </div>
    </div>
  );
}
