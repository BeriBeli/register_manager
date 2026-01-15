import { useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import type { Register, Field } from "@register-manager/shared";
import { useRegisterStore } from "../../stores/registerStore";
import { getFieldAccess } from "@register-manager/shared";

interface QuickEditPanelProps {
  item: Register | Field | null;
  itemType: "register" | "field" | null;
}

export function QuickEditPanel({ item, itemType }: QuickEditPanelProps) {
  const updateRegister = useRegisterStore((state) => state.updateRegister);
  const updateField = useRegisterStore((state) => state.updateField);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const [editedName, setEditedName] = useState(item?.name || "");
  const [editedDescription, setEditedDescription] = useState(item?.description || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    if (!item || !hasChanges) return;

    const updates = {
      name: editedName,
      description: editedDescription,
    };

    try {
      if (itemType === "register") {
        await updateRegister(item.id, updates);
      } else if (itemType === "field") {
        await updateField(item.id, updates);
      }
      setHasChanges(false);
    } catch (error) {
      // Error handled silently
    }
  };

  const handleNameChange = (value: string) => {
    setEditedName(value);
    setHasChanges(value !== item?.name || editedDescription !== item?.description);
  };

  const handleDescriptionChange = (value: string) => {
    setEditedDescription(value);
    setHasChanges(editedName !== item?.name || value !== item?.description);
  };

  if (!item || !itemType) {
    return (
      <div className="p-4 text-center text-surface-500">
        <p className="text-sm">Select an item to edit</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Quick Info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-surface-500 uppercase tracking-wide">
            {itemType === "register" ? "Register" : "Field"}
          </div>
          <div className="text-lg font-medium text-surface-100 mt-1">{item.name}</div>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="btn-primary text-xs"
            disabled={isLoading}
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        )}
      </div>

      {/* Register Info */}
      {itemType === "register" && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-surface-500">Address</div>
            <div className="font-mono text-primary-400 mt-1">
              {(item as Register).addressOffset}
            </div>
          </div>
          <div>
            <div className="text-surface-500">Size</div>
            <div className="text-surface-200 mt-1">{(item as Register).size} bits</div>
          </div>
        </div>
      )}

      {/* Field Info */}
      {itemType === "field" && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-surface-500">Bit Range</div>
            <div className="font-mono text-primary-400 mt-1">
              [{(item as Field).bitOffset + (item as Field).bitWidth - 1}:
              {(item as Field).bitOffset}]
            </div>
          </div>
          <div>
            <div className="text-surface-500">Access</div>
            <div className="text-surface-200 mt-1">{getFieldAccess(item as Field)}</div>
          </div>
        </div>
      )}

      {/* Editable Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Name</label>
          <input
            type="text"
            value={editedName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="input text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">
            Description
          </label>
          <textarea
            value={editedDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="input text-sm min-h-[60px]"
            placeholder="Add a description..."
          />
        </div>
      </div>

      {/* Warning for unsaved changes */}
      {hasChanges && (
        <div className="flex items-start gap-2 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-300">
            You have unsaved changes. Click "Save" to apply them.
          </div>
        </div>
      )}
    </div>
  );
}
