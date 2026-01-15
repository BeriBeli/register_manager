import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { ImportData, ImportPlugin, ImportPreviewResponse } from "@register-manager/shared";

interface ImportFromExcelDialogProps {
  onClose: () => void;
}

type Step = "upload" | "preview" | "confirm";

export function ImportFromExcelDialog({ onClose }: ImportFromExcelDialogProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Plugin state
  const [plugins, setPlugins] = useState<ImportPlugin[]>([]);
  const [pluginsLoading, setPluginsLoading] = useState(true);

  // State
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<string>("");
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [previewStats, setPreviewStats] = useState<ImportPreviewResponse["stats"] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch plugins on mount
  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const response = await fetch("/api/import/plugins", {
          credentials: "include",
        });
        const result = await response.json();
        if (result.data) {
          setPlugins(result.data);
          // Auto-select first plugin
          if (result.data.length > 0) {
            setSelectedPlugin(result.data[0].id);
          }
        }
      } catch (err) {
        // Error handled silently
      } finally {
        setPluginsLoading(false);
      }
    };
    fetchPlugins();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError(t("import.errors.invalid_file_type"));
    }
  }, [t]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };



  // Parse file using WASM plugin
  const parseFile = async (): Promise<ImportData | null> => {
    if (!selectedFile || !selectedPlugin) return null;

    try {
      // Find the selected plugin to get its path (although we might need the full URL)
      // The plugin object usually has a wasmPath relative to uploads.
      // We need to construct the full URL.
      const plugin = plugins.find(p => p.id === selectedPlugin);
      if (!plugin) throw new Error(t("import.errors.plugin_not_found"));

      // Construct URL: /uploads/plugins/filename
      // The backend serves uploads statically.
      // We need the filename from the path.
      // Assuming plugin.wasmPath is like "uploads\plugins\uuid-name.wasm" or just filename?
      // Let's check the backend logic. In plugins.ts, used `path.join("uploads", "plugins", filename)`.
      // The db stores the relative path?
      // I'll assume I need to fetch from `/api/uploads` or similar if `serveStatic` is set.
      // Backend index.ts: app.use("/uploads/*", serveStatic({ root: "./uploads" }))
      // So if path is "uploads/plugins/file.wasm", URL is "/uploads/plugins/file.wasm".
      // But verify what `plugin.wasmPath` contains. It likely contains the relative path stored in DB.

      let wasmUrl = "";
      if (plugin.wasmUrl) {
        if (plugin.wasmUrl.startsWith("http") || plugin.wasmUrl.startsWith("/")) {
          wasmUrl = plugin.wasmUrl;
        } else {
          // Normalize path separators and add leading slash
          const normalizedPath = plugin.wasmUrl.replace(/\\/g, "/");
          wasmUrl = `/${normalizedPath}`;
        }
      } else {
        // Fallback if wasmUrl is missing but it's a wasm plugin?
        throw new Error("Plugin has no WASM URL");
      }

      // Cache busting
      const timestamp = new Date().getTime();
      const urlWithCache = wasmUrl.includes('?') ? `${wasmUrl}&t=${timestamp}` : `${wasmUrl}?t=${timestamp}`;

      // Read file
      const buffer = await selectedFile.arrayBuffer();

      let result: ImportData;

      // Check if plugin has custom JS
      if (plugin.jsUrl) {
        let jsUrl = plugin.jsUrl;
        if (!jsUrl.startsWith("http") && !jsUrl.startsWith("/")) {
          jsUrl = `/${jsUrl.replace(/\\/g, "/")}`;
        }
        const jsUrlWithCache = jsUrl.includes('?') ? `${jsUrl}&t=${timestamp}` : `${jsUrl}?t=${timestamp}`;


        const module = await import(/* @vite-ignore */ jsUrlWithCache);

        // Initialize WASM with the specific URL
        // Note: __wbg_init (default) usually takes module_or_path
        if (module.default) {
          await module.default(urlWithCache);
        }

        if (typeof module.parse_excel !== 'function') {
          throw new Error("Plugin JS does not export parse_excel");
        }

        result = module.parse_excel(new Uint8Array(buffer)) as ImportData;
      } else {
        // Plugin must have jsUrl to parse files
        throw new Error(t("import.errors.plugin_missing_js") || "Plugin does not have parser JS");
      }

      return result;
    } catch (e: any) {
      // Error handled silently
      throw new Error(t("import.errors.parse_failed") + ": " + (e.message || e));
    }
  };

  // Handle preview generation
  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseFile();
      if (data) {
        setImportData(data);

        // Calculate stats
        let registerCount = 0;
        let fieldCount = 0;
        for (const mm of data.memoryMaps) {
          for (const ab of mm.addressBlocks) {
            registerCount += ab.registers.length;
            for (const reg of ab.registers) {
              fieldCount += reg.fields.length;
            }
          }
        }

        setPreviewStats({
          memoryMapCount: data.memoryMaps.length,
          addressBlockCount: data.memoryMaps.reduce((sum, mm) => sum + mm.addressBlocks.length, 0),
          registerCount,
          fieldCount,
        });

        setStep("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("import.errors.parse_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle import execution
  const handleImport = async () => {
    if (!importData) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: importData }),
      });

      const result = await response.json();

      if (result.success) {
        setStep("confirm");
        // Navigate to project after a short delay
        setTimeout(() => {
          navigate(`/project/${result.data.projectId}`);
        }, 1500);
      } else {
        const errorMsg = typeof result.error === 'object'
          ? JSON.stringify(result.error)
          : String(result.error || t("import.errors.import_failed"));
        setError(errorMsg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("import.errors.import_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-surface-100">
              {t("import.title")}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" disabled={isLoading}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 bg-surface-800/50 border-b border-surface-700">
          <div className="flex items-center justify-center gap-4">
            {["upload", "preview", "confirm"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step === s
                    ? "bg-primary-500 text-white"
                    : s === "confirm" && step === "confirm"
                      ? "bg-green-500 text-white"
                      : "bg-surface-700 text-surface-400"
                    }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm ${step === s ? "text-surface-100" : "text-surface-500"
                    }`}
                >
                  {t(`import.steps.${s}`)}
                </span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-surface-600" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-h-[65vh]">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              {/* Plugin Selection */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  {t("import.select_format")}
                </label>
                <div className="grid gap-2">
                  {pluginsLoading ? (
                    <div className="flex items-center justify-center py-4 text-surface-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {t("common.loading")}
                    </div>
                  ) : plugins.length === 0 ? (
                    <div className="p-4 text-center text-surface-500 border border-dashed border-surface-700 rounded-lg">
                      {t("import.no_plugins")}
                    </div>
                  ) : (
                    plugins.map((plugin: ImportPlugin) => (
                      <label
                        key={plugin.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlugin === plugin.id
                          ? "border-primary-500 bg-primary-500/10"
                          : "border-surface-700 hover:border-surface-600"
                          }`}
                      >
                        <input
                          type="radio"
                          name="plugin"
                          value={plugin.id}
                          checked={selectedPlugin === plugin.id}
                          onChange={(e) => setSelectedPlugin(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-surface-200">{plugin.name}</div>
                          <div className="text-sm text-surface-500">{plugin.description}</div>
                          <div className="text-xs text-surface-600 mt-1">
                            {t("import.supported_formats")}: {plugin.supportedExtensions.join(", ")}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  {t("import.select_file")}
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${selectedFile
                    ? "border-primary-500 bg-primary-500/5"
                    : "border-surface-700 hover:border-surface-500"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-primary-400" />
                      <div className="text-left">
                        <div className="font-medium text-surface-200">{selectedFile.name}</div>
                        <div className="text-sm text-surface-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-surface-500 mx-auto mb-3" />
                      <p className="text-surface-400">{t("import.drag_drop")}</p>
                      <p className="text-sm text-surface-600 mt-1">{t("import.or_click")}</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && importData && (
            <div className="space-y-6 pb-20"> {/* pb-20 for data list */}

              {/* Error - Moved to top for visibility */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg animate-pulse">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400">Import Failed</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {/* ... stats ... */}
                {previewStats && Object.entries(previewStats).map(([key, value]) => (
                  <div key={key} className="bg-surface-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary-400">{value}</div>
                    <div className="text-xs text-surface-500 capitalize">
                      {key.replace(/Count$/, "s").replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Preview Tree */}
              <div className="bg-surface-800 rounded-lg p-4 border border-surface-700">
                <h3 className="text-sm font-medium text-surface-300 mb-3 block">Data Preview</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {importData.memoryMaps.map((mm, i) => (
                    <div key={i} className="pl-2 border-l-2 border-primary-500/30">
                      <div className="text-sm font-semibold text-primary-300">{mm.name} (Memory Map)</div>
                      {mm.addressBlocks.map((ab, j) => (
                        <div key={j} className="ml-4 mt-2 pl-2 border-l-2 border-surface-600">
                          <div className="text-xs font-medium text-surface-200">
                            {ab.name} @ {ab.baseAddress}
                          </div>
                          <div className="ml-4 mt-1 space-y-1">
                            {ab.registers.slice(0, 10).map((reg, k) => (
                              <div key={k} className="text-[10px] text-surface-400 flex gap-2">
                                <span className="font-mono text-surface-500">{reg.addressOffset}</span>
                                <span>{reg.name}</span>
                              </div>
                            ))}
                            {ab.registers.length > 10 && (
                              <div className="text-[10px] text-surface-600 italic">
                                + {ab.registers.length - 10} more registers...
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Info */}
              <div className="bg-surface-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-surface-300 mb-3">{t("import.project_info")}</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-surface-500">{t("import.fields.name")}:</dt>
                  <dd className="text-surface-200">{importData.project.name}</dd>
                  <dt className="text-surface-500">{t("import.fields.vlnv")}:</dt>
                  <dd className="text-surface-200 font-mono text-xs">
                    {importData.project.vendor}:{importData.project.library}:{importData.project.name}:{importData.project.version}
                  </dd>
                </dl>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-400 mb-2">{t("import.warnings")}</h3>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-surface-100 mb-2">
                {t("import.success.title")}
              </h3>
              <p className="text-surface-400">{t("import.success.message")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-surface-700">
          <div>
            {step !== "upload" && step !== "confirm" && (
              <button
                onClick={() => setStep("upload")}
                className="btn-secondary"
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t("common.back")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
              {step === "confirm" ? t("common.close") : t("common.cancel")}
            </button>
            {step === "upload" && (
              <button
                onClick={handlePreview}
                className="btn-primary"
                disabled={!selectedFile || isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("import.next")}
              </button>
            )}
            {step === "preview" && (
              <button
                onClick={handleImport}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("import.import_btn")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
