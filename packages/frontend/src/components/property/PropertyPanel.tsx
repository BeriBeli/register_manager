import { useState } from "react";
import { Save, X } from "lucide-react";
import type { Project, Register, Field } from "@register-manager/shared";
import { useRegisterStore } from "../../stores/registerStore";
import { useTranslation } from "react-i18next";


type EditableEntity = Project | Register | Field | null;
type EntityType = "project" | "register" | "field" | null;

interface PropertyPanelProps {
  entity: EditableEntity;
  entityType: EntityType;
  onClose?: () => void;
}

export function PropertyPanel({ entity, entityType, onClose }: PropertyPanelProps) {
  const { t } = useTranslation();
  const updateRegister = useRegisterStore((state) => state.updateRegister);
  const updateField = useRegisterStore((state) => state.updateField);
  const updateProject = useRegisterStore((state) => state.updateProject);
  const isLoading = useRegisterStore((state) => state.isLoading);

  const [formData, setFormData] = useState<any>(entity || {});
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!entity || !isDirty) return;

    try {
      if (entityType === "register") {
        await updateRegister(entity.id, formData);
      } else if (entityType === "field") {
        await updateField(entity.id, formData);
      } else if (entityType === "project") {
        // Sanitize data to avoid Zod validation errors with null values
        const sanitizedData = { ...formData };
        if (sanitizedData.description === null) sanitizedData.description = undefined;
        if (sanitizedData.displayName === null) sanitizedData.displayName = undefined;

        await updateProject(entity.id, sanitizedData);
      }
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleReset = () => {
    setFormData(entity || {});
    setIsDirty(false);
  };

  if (!entity || !entityType) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-surface-500">
          <p>{t('property.empty_state')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-700">
        <div>
          <h3 className="text-lg font-medium text-surface-100">{t('property.title')}</h3>
          <p className="text-xs text-surface-500 mt-1">
            {t(`property.entity_types.${entityType}`)}
          </p>
        </div>
        <div className="flex items-center gap-2">

          {onClose && (
            <button onClick={onClose} className="btn-ghost p-2">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Common Properties */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-surface-300">{t('property.basic_info')}</h4>

          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">{t('property.labels.name')}</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="input text-sm"
              disabled={false}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">
              {t('property.labels.display_name')}
            </label>
            <input
              type="text"
              value={formData.displayName || ""}
              onChange={(e) => handleChange("displayName", e.target.value)}
              className="input text-sm"
              placeholder={t('property.placeholders.optional')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-400 mb-1">
              {t('property.labels.description')}
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              className="input text-sm min-h-[80px]"
              placeholder={t('property.placeholders.description')}
            />
          </div>
        </div>

        {/* Project-specific Properties */}
        {entityType === "project" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-surface-300">{t('property.vlnv')}</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t('property.labels.vendor')}
                </label>
                <input
                  type="text"
                  value={formData.vlnv?.vendor || ""}
                  onChange={(e) =>
                    handleChange("vlnv", { ...formData.vlnv, vendor: e.target.value })
                  }
                  className="input text-sm"
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t('property.labels.library')}
                </label>
                <input
                  type="text"
                  value={formData.vlnv?.library || ""}
                  onChange={(e) =>
                    handleChange("vlnv", { ...formData.vlnv, library: e.target.value })
                  }
                  className="input text-sm"
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t('property.labels.version')}
                </label>
                <input
                  type="text"
                  value={formData.vlnv?.version || ""}
                  onChange={(e) =>
                    handleChange("vlnv", { ...formData.vlnv, version: e.target.value })
                  }
                  className="input text-sm"
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {/* Project Members (Access Control) - REMOVED, moved to ShareDialog */}

        {/* Register-specific Properties */}
        {entityType === "register" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-surface-300">{t('property.register_config')}</h4>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1">
                {t('property.labels.address_offset')}
              </label>
              <input
                type="text"
                value={formData.addressOffset || ""}
                onChange={(e) => handleChange("addressOffset", e.target.value)}
                className="input text-sm font-mono"
                placeholder="0x00"
              />
              <p className="text-xs text-surface-500 mt-1">{t('property.hex_hint')}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1">
                {t('property.labels.size')}
              </label>
              <select
                value={formData.size || 32}
                onChange={(e) => handleChange("size", parseInt(e.target.value))}
                className="input text-sm"
              >
                <option value={8}>8 bits</option>
                <option value={16}>16 bits</option>
                <option value={32}>32 bits</option>
                <option value={64}>64 bits</option>
                <option value={128}>128 bits</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="register-volatile"
                checked={formData.volatile || false}
                onChange={(e) => handleChange("volatile", e.target.checked)}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-600"
              />
              <label htmlFor="register-volatile" className="text-sm text-surface-300">
                {t('property.labels.volatile')}
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1">
                {t('property.labels.type_identifier')}
              </label>
              <input
                type="text"
                value={formData.typeIdentifier || ""}
                onChange={(e) => handleChange("typeIdentifier", e.target.value)}
                className="input text-sm"
                placeholder={t('property.placeholders.optional')}
              />
            </div>
          </div>
        )}

        {/* Field-specific Properties */}
        {entityType === "field" && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-surface-300">{t('property.field_config')}</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t('property.labels.bit_offset')}
                </label>
                <input
                  type="number"
                  value={formData.bitOffset ?? 0}
                  onChange={(e) => handleChange("bitOffset", parseInt(e.target.value) || 0)}
                  className="input text-sm font-mono"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1">
                  {t('property.labels.bit_width')}
                </label>
                <input
                  type="number"
                  value={formData.bitWidth ?? 1}
                  onChange={(e) => handleChange("bitWidth", parseInt(e.target.value) || 1)}
                  className="input text-sm font-mono"
                  min={1}
                />
              </div>
            </div>

            <div className="p-3 bg-surface-800 rounded border border-surface-700">
              <div className="text-xs text-surface-400 mb-1">{t('property.labels.bit_range')}</div>
              <div className="font-mono text-primary-400">
                [{(formData.bitOffset ?? 0) + (formData.bitWidth ?? 1) - 1}:
                {formData.bitOffset ?? 0}]
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-volatile"
                checked={formData.volatile || false}
                onChange={(e) => handleChange("volatile", e.target.checked)}
                className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-600"
              />
              <label htmlFor="field-volatile" className="text-sm text-surface-300">
                {t('property.labels.volatile')}
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1">
                {t('property.labels.type_identifier')}
              </label>
              <input
                type="text"
                value={formData.typeIdentifier || ""}
                onChange={(e) => handleChange("typeIdentifier", e.target.value)}
                className="input text-sm"
                placeholder={t('property.placeholders.optional')}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 pt-4 border-t border-surface-700">
          <h4 className="text-xs font-medium text-surface-500">{t('property.metadata')}</h4>
          <div className="text-xs text-surface-500 space-y-1">
            <div className="flex justify-between">
              <span>{t('property.labels.id')}:</span>
              <span className="font-mono">{entity.id}</span>
            </div>
            {(entity as any).createdAt && (
              <div className="flex justify-between">
                <span>{t('property.labels.created')}:</span>
                <span>{new Date((entity as any).createdAt).toLocaleString()}</span>
              </div>
            )}
            {(entity as any).updatedAt && (
              <div className="flex justify-between">
                <span>{t('property.labels.updated')}:</span>
                <span>{new Date((entity as any).updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      {isDirty && (
        <div className="p-4 border-t border-surface-700 bg-surface-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400">{t('property.actions.unsaved_changes')}</span>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="btn-secondary text-sm" disabled={isLoading}>
                {t('property.actions.cancel')}
              </button>
              <button onClick={handleSave} className="btn-primary text-sm" disabled={isLoading}>
                <Save className="w-4 h-4" />
                {t('property.actions.save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
