import { useState } from "react";
import { X } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";
import { useNavigate } from "react-router-dom";

interface ProjectDialogProps {
  onClose: () => void;
}

export function ProjectDialog({ onClose }: ProjectDialogProps) {
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
      newErrors.name = "Name is required";
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = "Name must be a valid identifier (letters, numbers, underscore)";
    }

    if (!formData.vendor) {
      newErrors.vendor = "Vendor is required";
    }

    if (!formData.library) {
      newErrors.library = "Library is required";
    }

    if (!formData.version) {
      newErrors.version = "Version is required";
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
      setErrors({ submit: "Failed to create project. Please try again." });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">Create New Project</h2>
          <button onClick={onClose} className="btn-ghost p-2" disabled={isLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., uart_controller"
              disabled={isLoading}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            <p className="text-xs text-surface-500 mt-1">
              Used as identifier. Only letters, numbers, and underscores.
            </p>
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
              placeholder="e.g., UART Controller"
              disabled={isLoading}
            />
            <p className="text-xs text-surface-500 mt-1">Human-readable name (optional)</p>
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
              placeholder="Describe your project..."
              disabled={isLoading}
            />
          </div>

          {/* VLNV */}
          <div className="border-t border-surface-700 pt-4">
            <h3 className="text-sm font-medium text-surface-300 mb-3">
              VLNV Identifier (Vendor:Library:Name:Version)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  Vendor <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="input text-sm"
                  placeholder="mycompany"
                  disabled={isLoading}
                />
                {errors.vendor && <p className="text-xs text-red-400 mt-1">{errors.vendor}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  Library <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.library}
                  onChange={(e) => setFormData({ ...formData, library: e.target.value })}
                  className="input text-sm"
                  placeholder="ip"
                  disabled={isLoading}
                />
                {errors.library && <p className="text-xs text-red-400 mt-1">{errors.library}</p>}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  Version <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="input text-sm"
                  placeholder="1.0"
                  disabled={isLoading}
                />
                {errors.version && <p className="text-xs text-red-400 mt-1">{errors.version}</p>}
              </div>
            </div>

            <div className="mt-3 p-3 bg-surface-800 rounded border border-surface-700">
              <div className="text-xs text-surface-400 mb-1">Full VLNV</div>
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
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
