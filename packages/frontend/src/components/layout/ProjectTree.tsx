import { useState } from "react";
import { ChevronRight, ChevronDown, Map, Box, Cpu } from "lucide-react";
import { useRegisterStore } from "../../stores/registerStore";
import { clsx } from "clsx";
import type { MemoryMap, AddressBlock, Register } from "@register-manager/shared";

interface TreeNodeProps {
  label: string;
  icon: React.ElementType;
  expanded?: boolean;
  selected?: boolean;
  level?: number;
  onClick?: () => void;
  onToggle?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}

function TreeNode({
  label,
  icon: Icon,
  expanded,
  selected,
  level = 0,
  onClick,
  onToggle,
  children,
}: TreeNodeProps) {
  const hasChildren = !!children;

  return (
    <div>
      <div
        className={clsx(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors text-sm rounded-md",
          selected
            ? "bg-primary-600/20 text-primary-400"
            : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={onClick}
      >
        {hasChildren ? (
          <button
            onClick={onToggle}
            className="p-0.5 rounded hover:bg-surface-700/50"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4" /> // Spacer
        )}
        <Icon className="w-4 h-4" />
        <span className="truncate">{label}</span>
      </div>
      {expanded && children}
    </div>
  );
}

export function ProjectTree() {
  const currentProject = useRegisterStore((state) => state.currentProject);
  const selectedAddressBlockId = useRegisterStore((state) => state.selectedAddressBlockId);
  const selectedRegister = useRegisterStore((state) => state.selectedRegister);
  const setSelectedAddressBlockId = useRegisterStore((state) => state.setSelectedAddressBlockId);
  const setSelectedRegister = useRegisterStore((state) => state.setSelectedRegister);

  // Expanded states
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectAddressBlock = (id: string) => {
    setSelectedAddressBlockId(id);
    // When selecting address block manually, clear register selection
    setSelectedRegister(null);
  };

  const handleSelectRegister = (register: Register, addressBlockId: string) => {
    setSelectedRegister(register);
    setSelectedAddressBlockId(addressBlockId); // Ensure parent is selected context
  };

  if (!currentProject) return null;

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      <div className="text-xs font-semibold text-surface-500 px-2 py-2 mb-2 uppercase tracking-wider">
        Project Structure
      </div>

      {currentProject.memoryMaps?.map((mm) => (
        <TreeNode
          key={mm.id}
          label={mm.name}
          icon={Map}
          level={0}
          expanded={expandedNodes.has(mm.id)}
          onToggle={(e) => toggleNode(mm.id, e)}
          onClick={() => toggleNode(mm.id)}
        >
          {mm.addressBlocks?.map((ab) => (
            <TreeNode
              key={ab.id}
              label={ab.name}
              icon={Box}
              level={1}
              selected={selectedAddressBlockId === ab.id && !selectedRegister}
              expanded={expandedNodes.has(ab.id)}
              onToggle={(e) => toggleNode(ab.id, e)}
              onClick={() => handleSelectAddressBlock(ab.id)}
            >
              {ab.registers?.map((reg) => (
                <TreeNode
                  key={reg.id}
                  label={reg.name}
                  icon={Cpu}
                  level={2}
                  selected={selectedRegister?.id === reg.id}
                  onClick={() => handleSelectRegister(reg, ab.id)}
                />
              ))}
            </TreeNode>
          ))}
        </TreeNode>
      ))}
    </div>
  );
}
