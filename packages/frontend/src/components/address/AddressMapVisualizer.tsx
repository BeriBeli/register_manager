import type { Project, AddressBlock, Register } from "@register-manager/shared";
import { parseNumber, toHex } from "@register-manager/shared";

interface AddressGap {
  start: number;
  end: number;
  size: number;
}

interface AddressConflict {
  register1: Register;
  register2: Register;
  overlapStart: number;
  overlapEnd: number;
}

interface AddressMapVisualizerProps {
  project: Project;
  onRegisterClick?: (register: Register) => void;
}

export function AddressMapVisualizer({ project, onRegisterClick }: AddressMapVisualizerProps) {
  // Get all registers with absolute addresses
  const getAllRegisters = () => {
    const registers: Array<{ register: Register; absAddress: number; addressBlock: AddressBlock }> = [];

    project.memoryMaps?.forEach((mm) => {
      mm.addressBlocks?.forEach((ab) => {
        const baseAddr = parseNumber(ab.baseAddress);
        ab.registers?.forEach((reg) => {
          const offset = parseNumber(reg.addressOffset);
          registers.push({
            register: reg,
            absAddress: baseAddr + offset,
            addressBlock: ab,
          });
        });
      });
    });

    return registers.sort((a, b) => a.absAddress - b.absAddress);
  };

  const registers = getAllRegisters();

  // Detect conflicts
  const detectConflicts = (): AddressConflict[] => {
    const conflicts: AddressConflict[] = [];

    for (let i = 0; i < registers.length; i++) {
      for (let j = i + 1; j < registers.length; j++) {
        const reg1 = registers[i];
        const reg2 = registers[j];

        const end1 = reg1.absAddress + reg1.register.size / 8;
        const end2 = reg2.absAddress + reg2.register.size / 8;

        if (reg1.absAddress < end2 && reg2.absAddress < end1) {
          conflicts.push({
            register1: reg1.register,
            register2: reg2.register,
            overlapStart: Math.max(reg1.absAddress, reg2.absAddress),
            overlapEnd: Math.min(end1, end2),
          });
        }
      }
    }

    return conflicts;
  };

  // Detect gaps
  const detectGaps = (): AddressGap[] => {
    const gaps: AddressGap[] = [];

    for (let i = 0; i < registers.length - 1; i++) {
      const current = registers[i];
      const next = registers[i + 1];

      const currentEnd = current.absAddress + current.register.size / 8;
      const gap = next.absAddress - currentEnd;

      if (gap > 0) {
        gaps.push({
          start: currentEnd,
          end: next.absAddress,
          size: gap,
        });
      }
    }

    return gaps;
  };

  const conflicts = detectConflicts();
  const gaps = detectGaps();

  // Calculate total address space
  const totalSpace = registers.length > 0
    ? registers[registers.length - 1].absAddress +
    registers[registers.length - 1].register.size / 8 -
    registers[0].absAddress
    : 0;

  const usedSpace = registers.reduce((sum, r) => sum + r.register.size / 8, 0);
  const utilization = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">{registers.length}</div>
          <div className="text-sm text-surface-400">Registers</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">{toHex(totalSpace)}</div>
          <div className="text-sm text-surface-400">Total Space</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">{utilization.toFixed(1)}%</div>
          <div className="text-sm text-surface-400">Utilization</div>
        </div>
        <div className="card p-4">
          <div className={`text-2xl font-semibold ${conflicts.length > 0 ? "text-red-400" : "text-green-400"}`}>
            {conflicts.length}
          </div>
          <div className="text-sm text-surface-400">Conflicts</div>
        </div>
      </div>

      {/* Visual Map */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-surface-100 mb-4">Memory Layout</h3>
        <div className="space-y-2">
          {registers.map((item, idx) => {
            const registerSize = item.register.size / 8;
            const hasConflict = conflicts.some(
              (c) => c.register1.id === item.register.id || c.register2.id === item.register.id
            );

            return (
              <div key={item.register.id}>
                {/* Gap indicator */}
                {idx > 0 && gaps[idx - 1] && gaps[idx - 1].size > 0 && (
                  <div className="flex items-center gap-2 py-1 px-3 bg-surface-800/30 rounded text-xs text-surface-500">
                    <div className="flex-1 border-t border-dashed border-surface-600" />
                    <span>Gap: {toHex(gaps[idx - 1].size)} bytes</span>
                    <div className="flex-1 border-t border-dashed border-surface-600" />
                  </div>
                )}

                {/* Register */}
                <div
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer ${hasConflict
                      ? "bg-red-900/20 border-red-500 hover:bg-red-900/30"
                      : "bg-surface-800 border-surface-700 hover:border-surface-600"
                    }`}
                  onClick={() => onRegisterClick?.(item.register)}
                >
                  <div className="w-32 font-mono text-sm text-primary-400">
                    {toHex(item.absAddress, 8)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-100">
                      {item.register.displayName || item.register.name}
                    </div>
                    <div className="text-xs text-surface-500">
                      {item.register.size} bits ({registerSize} bytes)
                    </div>
                  </div>
                  <div className="text-sm text-surface-400">
                    {item.addressBlock.name}
                  </div>
                  {hasConflict && (
                    <div className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-400">
                      Conflict
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflicts List */}
      {conflicts.length > 0 && (
        <div className="card p-6 border-red-500/50">
          <h3 className="text-lg font-medium text-red-400 mb-4">⚠️ Address Conflicts Detected</h3>
          <div className="space-y-3">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-surface-100">Conflict #{idx + 1}</span>
                  <span className="text-xs font-mono text-red-400">
                    {toHex(conflict.overlapStart, 8)} - {toHex(conflict.overlapEnd, 8)}
                  </span>
                </div>
                <div className="text-sm text-surface-300">
                  <div>• {conflict.register1.name}</div>
                  <div>• {conflict.register2.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps Summary */}
      {gaps.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-surface-100 mb-4">Address Gaps</h3>
          <div className="text-sm text-surface-400">
            {gaps.length} gaps found, total unused space: {toHex(gaps.reduce((sum, g) => sum + g.size, 0))} bytes
          </div>
        </div>
      )}
    </div>
  );
}
