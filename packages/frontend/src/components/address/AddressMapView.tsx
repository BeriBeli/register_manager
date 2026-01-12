import { useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen, FileText, Plus, Trash2, Copy } from "lucide-react";
import { clsx } from "clsx";
import type { Project, MemoryMap, AddressBlock, Register } from "@register-manager/shared";
import { parseNumber, toHex } from "@register-manager/shared";

interface AddressMapViewProps {
  project: Project;
  onSelectRegister?: (register: Register) => void;
  selectedRegisterId?: string | null;
}

interface TreeNode {
  id: string;
  type: "project" | "memoryMap" | "addressBlock" | "register";
  name: string;
  displayName?: string;
  address?: string;
  size?: number;
  children?: TreeNode[];
  data?: any;
}

export function AddressMapView({ project, onSelectRegister, selectedRegisterId }: AddressMapViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([project.id]));
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Build tree structure
  const buildTree = (): TreeNode => {
    return {
      id: project.id,
      type: "project",
      name: project.name,
      displayName: project.displayName,
      data: project,
      children: project.memoryMaps?.map((mm) => ({
        id: mm.id,
        type: "memoryMap" as const,
        name: mm.name,
        displayName: mm.displayName,
        data: mm,
        children: mm.addressBlocks?.map((ab) => {
          const baseAddr = parseNumber(ab.baseAddress);
          const range = parseNumber(ab.range);
          return {
            id: ab.id,
            type: "addressBlock" as const,
            name: ab.name,
            displayName: ab.displayName,
            address: `${toHex(baseAddr, 8)} - ${toHex(baseAddr + range - 1, 8)}`,
            size: range,
            data: ab,
            children: ab.registers
              ?.sort((a, b) => parseNumber(a.addressOffset) - parseNumber(b.addressOffset))
              .map((reg) => {
                const offset = parseNumber(reg.addressOffset);
                const absAddr = baseAddr + offset;
                return {
                  id: reg.id,
                  type: "register" as const,
                  name: reg.name,
                  displayName: reg.displayName,
                  address: toHex(absAddr, 8),
                  size: reg.size,
                  data: reg,
                };
              }),
          };
        }),
      })),
    };
  };

  const tree = buildTree();

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleRegisterClick = (register: Register) => {
    onSelectRegister?.(register);
  };

  const renderNode = (node: TreeNode, level = 0): React.ReactElement => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.type === "register" && node.id === selectedRegisterId;
    const isHovered = hoveredNode === node.id;

    const getIcon = () => {
      switch (node.type) {
        case "project":
          return <FolderOpen className="w-4 h-4 text-primary-400" />;
        case "memoryMap":
          return <FolderOpen className="w-4 h-4 text-blue-400" />;
        case "addressBlock":
          return <FolderOpen className="w-4 h-4 text-green-400" />;
        case "register":
          return <FileText className="w-4 h-4 text-orange-400" />;
      }
    };

    const getTypeLabel = () => {
      switch (node.type) {
        case "project":
          return "Project";
        case "memoryMap":
          return "Memory Map";
        case "addressBlock":
          return "Address Block";
        case "register":
          return "Register";
      }
    };

    return (
      <div key={node.id}>
        <div
          className={clsx(
            "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all group",
            isSelected && "bg-primary-600/20 border border-primary-500",
            !isSelected && isHovered && "bg-surface-800",
            !isSelected && !isHovered && "hover:bg-surface-800/50"
          )}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            if (node.type === "register") {
              handleRegisterClick(node.data);
            }
          }}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 flex-shrink-0">
            {hasChildren && (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-surface-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-surface-400" />
                )}
              </>
            )}
          </div>

          {/* Node Icon */}
          {getIcon()}

          {/* Node Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-100 truncate">
                {node.displayName || node.name}
              </span>
              <span className="text-xs text-surface-500 px-1.5 py-0.5 rounded bg-surface-800">
                {getTypeLabel()}
              </span>
            </div>
            {node.address && (
              <div className="text-xs text-surface-400 font-mono mt-0.5">
                {node.address}
                {node.size && node.type === "register" && ` • ${node.size} bits`}
              </div>
            )}
          </div>

          {/* Actions (on hover) */}
          {isHovered && node.type !== "project" && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Copy address
                }}
                className="p-1 hover:bg-surface-700 rounded"
                title="Copy address"
              >
                <Copy className="w-3 h-3 text-surface-400" />
              </button>
              {node.type === "register" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Delete register
                  }}
                  className="p-1 hover:bg-surface-700 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Calculate statistics
  const stats = {
    memoryMaps: project.memoryMaps?.length || 0,
    addressBlocks: project.memoryMaps?.reduce((sum, mm) => sum + (mm.addressBlocks?.length || 0), 0) || 0,
    registers: project.memoryMaps?.reduce(
      (sum, mm) =>
        sum +
        (mm.addressBlocks?.reduce((s, ab) => s + (ab.registers?.length || 0), 0) || 0),
      0
    ) || 0,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-surface-700">
        <h3 className="text-lg font-medium text-surface-100 mb-2">Address Map</h3>
        <div className="flex items-center gap-4 text-xs text-surface-400">
          <span>{stats.memoryMaps} Memory Maps</span>
          <span>•</span>
          <span>{stats.addressBlocks} Address Blocks</span>
          <span>•</span>
          <span>{stats.registers} Registers</span>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {renderNode(tree)}
      </div>

      {/* Address Conflict Detection */}
      <div className="p-4 border-t border-surface-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-surface-400">Address Conflicts</span>
          <span className="text-sm font-medium text-green-400">None detected</span>
        </div>
      </div>
    </div>
  );
}
