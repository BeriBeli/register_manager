import { useState } from "react";
import { X, Download, FileText, FileCode, File, Globe } from "lucide-react";

interface ExportDialogProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

type ExportFormat = "ipxact" | "c-header" | "uvm-ral" | "html";

const formats = [
  {
    id: "ipxact" as ExportFormat,
    name: "IP-XACT XML",
    description: "IEEE 1685-2022 standard XML format",
    icon: FileCode,
    extension: ".xml",
  },
  {
    id: "c-header" as ExportFormat,
    name: "C Header File",
    description: "C header with register definitions and macros",
    icon: FileText,
    extension: ".h",
  },
  {
    id: "uvm-ral" as ExportFormat,
    name: "UVM RAL",
    description: "SystemVerilog UVM Register Abstraction Layer",
    icon: File,
    extension: ".sv",
  },
  {
    id: "html" as ExportFormat,
    name: "HTML Documentation",
    description: "Human-readable documentation",
    icon: Globe,
    extension: ".html",
  },
];

export function ExportDialog({ projectId, projectName, onClose }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("ipxact");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/export/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: selectedFormat,
          options: {},
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const format = formats.find((f) => f.id === selectedFormat);
      a.download = `${projectName}${format?.extension || ".txt"}`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-lg font-semibold text-surface-100">Export Project</h2>
          <button onClick={onClose} className="btn-ghost p-2" disabled={isExporting}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-surface-400 mb-4">
            Select an export format for <span className="text-surface-200 font-medium">{projectName}</span>
          </p>

          <div className="space-y-2">
            {formats.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;

              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isSelected
                      ? "border-primary-500 bg-primary-600/10"
                      : "border-surface-700 hover:border-surface-600 bg-surface-800"
                    }`}
                  disabled={isExporting}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${isSelected ? "bg-primary-600/20" : "bg-surface-700"}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? "text-primary-400" : "text-surface-400"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${isSelected ? "text-primary-400" : "text-surface-200"}`}>
                          {format.name}
                        </h3>
                        <span className="text-xs font-mono text-surface-500">{format.extension}</span>
                      </div>
                      <p className="text-sm text-surface-400 mt-1">{format.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-surface-700">
          <button onClick={onClose} className="btn-secondary" disabled={isExporting}>
            Cancel
          </button>
          <button onClick={handleExport} className="btn-primary" disabled={isExporting}>
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
