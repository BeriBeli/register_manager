import { clsx } from "clsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

interface Field {
  id: string;
  name: string;
  bitOffset: number;
  bitWidth: number;
  access: string;
  description?: string;
}

interface BitFieldVisualizerProps {
  fields: Field[];
  registerSize: number;
}

const accessColors: Record<string, string> = {
  "read-write": "bg-green-600/40 border-green-500 hover:bg-green-600/60",
  "read-only": "bg-blue-600/40 border-blue-500 hover:bg-blue-600/60",
  "write-only": "bg-orange-600/40 border-orange-500 hover:bg-orange-600/60",
  reserved: "bg-surface-700 border-surface-600",
};

export function BitFieldVisualizer({ fields, registerSize }: BitFieldVisualizerProps) {
  const bitsPerRow = 16;
  const rows = Math.ceil(registerSize / bitsPerRow);

  // Create a map of bit position to field
  const bitToField = new Map<number, Field>();
  fields.forEach((field) => {
    for (let i = 0; i < field.bitWidth; i++) {
      bitToField.set(field.bitOffset + i, field);
    }
  });

  // Generate rows (high bits first)
  const rowElements = [];
  for (let row = rows - 1; row >= 0; row--) {
    const startBit = row * bitsPerRow;
    const endBit = Math.min(startBit + bitsPerRow, registerSize);

    const cells = [];
    for (let bit = endBit - 1; bit >= startBit; bit--) {
      const field = bitToField.get(bit);
      const isFieldStart = field && field.bitOffset === bit;
      const isFieldEnd = field && field.bitOffset + field.bitWidth - 1 === bit;

      const colorClass = field ? accessColors[field.access] || accessColors.reserved : accessColors.reserved;

      cells.push(
        <TooltipProvider key={bit}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={clsx(
                  "h-10 flex items-center justify-center text-2xs font-mono cursor-pointer transition-colors border-y border-r",
                  colorClass,
                  isFieldStart && "rounded-l border-l",
                  isFieldEnd && "rounded-r",
                  !field && "border-l"
                )}
              >
                <span className="text-surface-300">{bit}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-surface-800 border border-surface-600 rounded-md px-3 py-2 text-sm shadow-lg z-50"
            >
              {field ? (
                <div>
                  <div className="font-medium text-surface-100">{field.name}</div>
                  <div className="text-xs text-surface-400">
                    Bits [{field.bitOffset + field.bitWidth - 1}:{field.bitOffset}]
                  </div>
                  {field.description && (
                    <div className="text-xs text-surface-500 mt-1">{field.description}</div>
                  )}
                </div>
              ) : (
                <div className="text-surface-400">Reserved</div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    rowElements.push(
      <div key={row} className="flex">
        <div className="w-12 flex items-center justify-end pr-2 text-xs text-surface-500 font-mono">
          {endBit - 1}..{startBit}
        </div>
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${endBit - startBit}, 1fr)` }}>
          {cells}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bit field grid */}
      <div className="space-y-1">{rowElements}</div>

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

      {/* Fields list */}
      <div className="border-t border-surface-700 pt-4">
        <h4 className="text-sm font-medium text-surface-300 mb-2">Fields</h4>
        <div className="grid grid-cols-2 gap-2">
          {fields
            .sort((a, b) => b.bitOffset - a.bitOffset)
            .map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-2 rounded bg-surface-800 text-sm"
              >
                <div>
                  <span className="font-medium text-surface-200">{field.name}</span>
                  <span className="text-surface-500 ml-2 font-mono text-xs">
                    [{field.bitOffset + field.bitWidth - 1}:{field.bitOffset}]
                  </span>
                </div>
                <span
                  className={clsx(
                    "text-xs px-2 py-0.5 rounded",
                    field.access === "read-write" && "bg-green-900/50 text-green-400",
                    field.access === "read-only" && "bg-blue-900/50 text-blue-400",
                    field.access === "write-only" && "bg-orange-900/50 text-orange-400"
                  )}
                >
                  {field.access === "read-write" ? "RW" : field.access === "read-only" ? "RO" : "WO"}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
