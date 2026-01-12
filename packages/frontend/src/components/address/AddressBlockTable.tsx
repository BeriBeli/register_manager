import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AddressBlock } from "@register-manager/shared";
import { parseNumber } from "@register-manager/shared";

interface AddressBlockTableProps {
  addressBlocks: AddressBlock[];
  onSelect: (block: AddressBlock) => void;
  onEdit?: (block: AddressBlock) => void;
  onDelete?: (id: string) => void;
}

export function AddressBlockTable({ addressBlocks, onSelect, onEdit, onDelete }: AddressBlockTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead className="bg-surface-800">
          <tr>
            <th className="table-cell table-header text-left w-8"></th>
            <th className="table-cell table-header text-left">Base Address</th>
            <th className="table-cell table-header text-left">Name</th>
            <th className="table-cell table-header text-left">Range</th>
            <th className="table-cell table-header text-left">Width</th>
            <th className="table-cell table-header text-left">Usage</th>
            <th className="table-cell table-header text-left">Description</th>
            <th className="table-cell table-header text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {addressBlocks.map((block) => {
            const isExpanded = expandedRows.has(block.id);
            return (
              <>
                <tr
                  key={block.id}
                  className="table-row cursor-pointer hover:bg-surface-800/50 transition-colors"
                  onClick={() => onSelect(block)}
                >
                  <td className="table-cell">
                    <button
                      onClick={(e) => toggleRow(e, block.id)}
                      className="p-1 hover:bg-surface-700 rounded text-surface-400"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="table-cell font-mono text-primary-400">
                    0x{parseNumber(block.baseAddress).toString(16).toUpperCase()}
                  </td>
                  <td className="table-cell">
                    <div className="font-medium text-surface-100">{block.name}</div>
                    {block.displayName && (
                      <div className="text-xs text-surface-500">{block.displayName}</div>
                    )}
                  </td>
                  <td className="table-cell font-mono">0x{parseNumber(block.range).toString(16).toUpperCase()}</td>
                  <td className="table-cell font-mono">{block.width} bits</td>
                  <td className="table-cell text-surface-300">{block.usage || "register"}</td>
                  <td className="table-cell text-surface-400 truncate max-w-xs">
                    {block.description || "-"}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(block);
                          }}
                          className="p-1.5 hover:bg-surface-700 rounded text-surface-400 hover:text-primary-400 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(block.id);
                          }}
                          className="p-1.5 hover:bg-surface-700 rounded text-surface-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded details - could show stats or description */}
                {isExpanded && (
                  <tr key={`${block.id}-details`}>
                    <td colSpan={8} className="p-0">
                      <div className="bg-surface-800/50 border-y border-surface-700 p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-surface-500 block mb-1">Full Description</span>
                            <p className="text-surface-200">{block.description || "No description provided."}</p>
                          </div>
                          <div>
                            <span className="text-surface-500 block mb-1">Items</span>
                            <p className="text-surface-200">{block.registers?.length || 0} Registers</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
