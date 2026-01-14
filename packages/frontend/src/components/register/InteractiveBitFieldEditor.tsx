import { useState } from "react";
import { clsx } from "clsx";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";
import type { Field } from "@register-manager/shared";
import { getFieldAccess } from "@register-manager/shared";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useTranslation } from "react-i18next";

interface InteractiveBitFieldEditorProps {
  registerId: string;
  fields: Field[];
  registerSize: number;
  onFieldClick?: (field: Field) => void;
  onAddField?: () => void;
  onRangeSelected?: (startBit: number, endBit: number) => void;
}

const accessColors: Record<string, string> = {
  "read-write": "bg-green-600/40 border-green-500 hover:bg-green-600/60",
  "read-only": "bg-blue-600/40 border-blue-500 hover:bg-blue-600/60",
  "write-only": "bg-orange-600/40 border-orange-500 hover:bg-orange-600/60",
  reserved: "bg-surface-700 border-surface-600 hover:bg-surface-600",
};

export function InteractiveBitFieldEditor({
  registerId,
  fields,
  registerSize,
  onFieldClick,
  onAddField,
  onRangeSelected,
}: InteractiveBitFieldEditorProps) {
  const { t } = useTranslation();
  const deleteField = useRegisterStore((state) => state.deleteField);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  // Confirm Dialog State
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartBit, setDragStartBit] = useState<number | null>(null);
  const [currentDragBit, setCurrentDragBit] = useState<number | null>(null);

  const bitsPerRow = 16;
  const rows = Math.ceil(registerSize / bitsPerRow);

  // Create a map of bit position to field
  const bitToField = new Map<number, Field>();
  fields.forEach((field) => {
    for (let i = 0; i < field.bitWidth; i++) {
      bitToField.set(field.bitOffset + i, field);
    }
  });

  const getSelectionRange = () => {
    if (dragStartBit === null || currentDragBit === null) return null;
    const start = Math.min(dragStartBit, currentDragBit);
    const end = Math.max(dragStartBit, currentDragBit);
    return { start, end };
  };

  const isBitInSelection = (bit: number) => {
    const range = getSelectionRange();
    if (!range) return false;
    return bit >= range.start && bit <= range.end;
  };

  const handleMouseDown = (bit: number) => {
    // Only allow starting selection on empty bits
    if (!bitToField.has(bit)) {
      setIsDragging(true);
      setDragStartBit(bit);
      setCurrentDragBit(bit);
    }
  };

  const handleMouseEnterBit = (bit: number) => {
    if (isDragging) {
      setCurrentDragBit(bit);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartBit !== null && currentDragBit !== null) {
      const range = getSelectionRange();
      if (range) {
        // Check if selection overlaps with any existing fields
        let hasOverlap = false;
        for (let i = range.start; i <= range.end; i++) {
          if (bitToField.has(i)) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap && onRangeSelected) {
          // bitOffset = start, bitWidth = end - start + 1
          // Actually onRangeSelected expects (startBit, endBit) inclusive
          onRangeSelected(range.start, range.end);
        }
      }
    }
    setIsDragging(false);
    setDragStartBit(null);
    setCurrentDragBit(null);
  };

  // Group consecutive bits of the same field
  const getFieldSegments = (field: Field, startBit: number, endBit: number) => {
    const segments: Array<{ start: number; end: number }> = [];
    let segmentStart = -1;

    for (let bit = startBit; bit < endBit; bit++) {
      const bitField = bitToField.get(bit);
      if (bitField?.id === field.id) {
        if (segmentStart === -1) {
          segmentStart = bit;
        }
      } else if (segmentStart !== -1) {
        segments.push({ start: segmentStart, end: bit });
        segmentStart = -1;
      }
    }

    if (segmentStart !== -1) {
      segments.push({ start: segmentStart, end: endBit });
    }

    return segments;
  };

  const handleFieldClick = (field: Field) => {
    setSelectedField(field.id);
    onFieldClick?.(field);
  };

  const handleDeleteFieldClick = (e: React.MouseEvent, field: Field) => {
    e.stopPropagation();
    setFieldToDelete(field);
  };

  const handleConfirmDelete = async () => {
    if (!fieldToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteField(fieldToDelete.id);
      setFieldToDelete(null);
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Calculate if register is full
  const occupiedBits = bitToField.size;
  const isFull = occupiedBits >= registerSize;

  // Generate rows (high bits first)
  const rowElements = [];
  for (let row = rows - 1; row >= 0; row--) {
    const startBit = row * bitsPerRow;
    const endBit = Math.min(startBit + bitsPerRow, registerSize);

    // Render field segments for this row
    const renderedFields = new Set<string>();
    const cells = [];

    for (let bit = endBit - 1; bit >= startBit; bit--) {
      const field = bitToField.get(bit);
      const isFieldStart = field && field.bitOffset === bit; // LSB (Right side)
      const isFieldEnd = field && field.bitOffset + field.bitWidth - 1 === bit; // MSB (Left side)
      const isHovered = field && hoveredField === field.id;
      const isSelected = field && selectedField === field.id;
      const isInSelection = !field && isBitInSelection(bit);

      const colorClass = field
        ? accessColors[getFieldAccess(field)] || accessColors.reserved
        : isInSelection
          ? "bg-primary-500/20 border-primary-500/50"
          : accessColors.reserved;

      // Check if this is the first bit of the field in this row
      const isFirstInRow = field && !renderedFields.has(field.id);
      if (field && isFirstInRow) {
        renderedFields.add(field.id);
      }

      // Show label/controls on the MSB (visually top-left-most part of the field)
      const showControls = isFieldEnd;
      const showLabel = isFieldEnd;

      cells.push(
        <div
          key={bit}
          className={clsx(
            "h-12 flex items-center justify-center text-2xs font-mono cursor-pointer transition-all border-y border-r relative group select-none",
            colorClass,
            isFieldEnd && "rounded-l border-l",
            isFieldStart && "rounded-r",
            !field && "border-l",
            isHovered && "ring-2 ring-primary-400 z-10",
            isSelected && "ring-2 ring-primary-500 z-10",
            isInSelection && "ring-1 ring-primary-400 z-10"
          )}
          onMouseDown={(e) => {
            if (field) {
              handleFieldClick(field);
            } else {
              handleMouseDown(bit);
            }
          }}
          onMouseEnter={() => {
            if (field) {
              setHoveredField(field.id);
            } else {
              handleMouseEnterBit(bit);
            }
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setHoveredField(null)}
        >
          {/* Bit number */}
          <span className="absolute top-0.5 left-1 text-surface-500 text-[9px] font-mono pointer-events-none leading-none opacity-60 group-hover:opacity-100">
            {bit}
          </span>

          {/* Field name */}
          {field && showLabel && field.bitWidth > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1">
              <span className="text-xs font-medium text-surface-100 truncate max-w-full bg-surface-900/50 px-1 rounded backdrop-blur-[1px]">
                {field.name}
              </span>
            </div>
          )}

          {/* Hover actions */}
          {field && isHovered && showControls && (
            <div className="absolute -top-8 left-0 bg-surface-800 border border-surface-600 rounded px-2 py-1 flex items-center gap-1 z-20 shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFieldClick(field);
                }}
                className="p-1 hover:bg-surface-700 rounded"
                title="Edit field"
              >
                <Edit2 className="w-3 h-3 text-primary-400" />
              </button>
              <button
                onClick={(e) => handleDeleteFieldClick(e, field)}
                className="p-1 hover:bg-surface-700 rounded"
                title="Delete field"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          )}
        </div>
      );
    }

    rowElements.push(
      <div key={row} className="flex">
        <div className="w-16 flex items-center justify-end pr-3 text-xs text-surface-500 font-mono">
          {endBit - 1}..{startBit}
        </div>
        <div
          className="flex-1 grid"
          style={{ gridTemplateColumns: `repeat(${endBit - startBit}, 1fr)` }}
        >
          {cells}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <ConfirmDialog
        isOpen={!!fieldToDelete}
        onClose={() => setFieldToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("project.delete_field.title")}
        description={t("project.delete_field.desc", { name: fieldToDelete?.name })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* Bit field grid */}
      <div className="space-y-1">{rowElements}</div>

      {/* Add field button */}
      {onAddField && (
        <button
          onClick={onAddField}
          disabled={isFull}
          className={clsx(
            "w-full py-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors",
            isFull
              ? "border-surface-700 text-surface-600 cursor-not-allowed opacity-50"
              : "border-surface-700 hover:border-primary-500 text-surface-400 hover:text-primary-400"
          )}
        >
          <Plus className="w-4 h-4" />
          {isFull ? "Register Full" : "Add Field"}
        </button>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-4 border-t border-surface-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600/40 border border-green-500" />
          <span className="text-xs text-surface-400">Read-Write</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600/40 border border-blue-500" />
          <span className="text-xs text-surface-400">Read-Only</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-600/40 border border-orange-500" />
          <span className="text-xs text-surface-400">Write-Only</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface-700 border border-surface-600" />
          <span className="text-xs text-surface-400">Reserved</span>
        </div>
      </div>

      {/* Fields list with details */}
      <div className="border-t border-surface-700 pt-4">
        <h4 className="text-sm font-medium text-surface-300 mb-3">Fields</h4>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-surface-500">
            No fields defined. Click "Add Field" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {fields
              .sort((a, b) => b.bitOffset - a.bitOffset)
              .map((field) => (
                <div
                  key={field.id}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                    selectedField === field.id
                      ? "bg-primary-600/10 border-primary-500"
                      : "bg-surface-800 border-surface-700 hover:border-surface-600"
                  )}
                  onClick={() => handleFieldClick(field)}
                  onMouseEnter={() => setHoveredField(field.id)}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-surface-200">{field.name}</span>
                      <span className="text-surface-500 text-xs font-mono">
                        [{field.bitOffset + field.bitWidth - 1}:{field.bitOffset}]
                      </span>
                      <span
                        className={clsx(
                          "text-xs px-2 py-0.5 rounded",
                          getFieldAccess(field) === "read-write" && "bg-green-900/50 text-green-400",
                          getFieldAccess(field) === "read-only" && "bg-blue-900/50 text-blue-400",
                          getFieldAccess(field) === "write-only" && "bg-orange-900/50 text-orange-400"
                        )}
                      >
                        {getFieldAccess(field) === "read-write"
                          ? "RW"
                          : getFieldAccess(field) === "read-only"
                            ? "RO"
                            : "WO"}
                      </span>
                      {field.resets?.[0]?.value && (
                        <span className="text-xs text-surface-400 font-mono bg-surface-900/40 px-1.5 py-0.5 rounded border border-surface-700">
                          Rst: {field.resets[0].value}
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-surface-500 mt-1">{field.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFieldClick(field);
                      }}
                      className="p-2 hover:bg-surface-700 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-surface-400" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFieldClick(e, field)}
                      className="p-2 hover:bg-surface-700 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
