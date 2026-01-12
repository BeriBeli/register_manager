import { ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import type { Register } from "@register-manager/shared";
import { getFieldAccess } from "@register-manager/shared";

interface RegisterTableProps {
  registers: Register[];
  onEdit?: (register: Register) => void;
  onDelete?: (id: string) => void;
}

function AccessBadge({ access }: { access: string }) {
  const badgeClass = {
    "read-write": "badge-rw",
    "read-only": "badge-ro",
    "write-only": "badge-wo",
  }[access] || "badge-reserved";

  const label = {
    "read-write": "RW",
    "read-only": "RO",
    "write-only": "WO",
  }[access] || access;

  return <span className={badgeClass}>{label}</span>;
}

export function RegisterTable({ registers, onEdit, onDelete }: RegisterTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
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
            <th className="table-cell table-header text-left">Address</th>
            <th className="table-cell table-header text-left">Name</th>
            <th className="table-cell table-header text-left">Size</th>
            <th className="table-cell table-header text-left">Description</th>
            <th className="table-cell table-header text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {registers.map((reg) => {
            const isExpanded = expandedRows.has(reg.id);
            return (
              <>
                <tr
                  key={reg.id}
                  className="table-row cursor-pointer"
                  onClick={() => toggleRow(reg.id)}
                >
                  <td className="table-cell">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-surface-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    )}
                  </td>
                  <td className="table-cell font-mono text-primary-400">
                    {reg.addressOffset}
                  </td>
                  <td className="table-cell">
                    <div className="font-medium text-surface-100">{reg.name}</div>
                    {reg.displayName && (
                      <div className="text-xs text-surface-500">{reg.displayName}</div>
                    )}
                  </td>
                  <td className="table-cell font-mono">{reg.size} bits</td>
                  <td className="table-cell text-surface-400 truncate max-w-xs">
                    {reg.description || "-"}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(reg);
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
                            onDelete(reg.id);
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

                {/* Expanded fields */}
                {isExpanded && (
                  <tr key={`${reg.id}-fields`}>
                    <td colSpan={6} className="p-0">
                      <div className="bg-surface-800/50 border-y border-surface-700">
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs text-surface-500">
                              <th className="px-4 py-2 text-left pl-12">Bits</th>
                              <th className="px-4 py-2 text-left">Field</th>
                              <th className="px-4 py-2 text-left">Access</th>
                              <th className="px-4 py-2 text-left">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reg.fields
                              .sort((a, b) => b.bitOffset - a.bitOffset)
                              .map((field) => (
                                <tr
                                  key={field.id}
                                  className="border-t border-surface-700/50 hover:bg-surface-700/30"
                                >
                                  <td className="px-4 py-2 pl-12 font-mono text-xs text-surface-400">
                                    [{field.bitOffset + field.bitWidth - 1}:{field.bitOffset}]
                                  </td>
                                  <td className="px-4 py-2 text-sm font-medium text-surface-200">
                                    {field.name}
                                  </td>
                                  <td className="px-4 py-2">
                                    <AccessBadge access={getFieldAccess(field)} />
                                  </td>
                                  <td className="px-4 py-2 text-sm text-surface-400">
                                    {field.description || "-"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
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
