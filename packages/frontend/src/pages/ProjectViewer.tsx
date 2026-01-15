import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RegisterTable } from "../components/register/RegisterTable";
import { InteractiveBitFieldEditor } from "../components/register/InteractiveBitFieldEditor";
import { AddressBlockTable } from "../components/address/AddressBlockTable";
import { PropertyPanel } from "../components/property/PropertyPanel";
import { ExportDialog } from "../components/export/ExportDialog";
import { useRegisterStore } from "../stores/registerStore";
import { Download, Loader2, Settings as SettingsIcon, ChevronRight, MoreVertical, Search } from "lucide-react";
import { parseNumber } from "@register-manager/shared";
import { useTranslation } from "react-i18next";
import { GlobalSearchDialog } from "../components/project/GlobalSearchDialog";

export function ProjectViewer() {
  const { t } = useTranslation();
  const { id } = useParams();
  const currentProject = useRegisterStore((state) => state.currentProject);
  const isLoading = useRegisterStore((state) => state.isLoading);
  const fetchProject = useRegisterStore((state) => state.fetchProject);
  const selectedRegister = useRegisterStore((state) => state.selectedRegister);
  const setSelectedRegister = useRegisterStore((state) => state.setSelectedRegister);
  const selectedAddressBlockId = useRegisterStore((state) => state.selectedAddressBlockId);
  const setSelectedAddressBlockId = useRegisterStore((state) => state.setSelectedAddressBlockId);
  const selectedMemoryMapId = useRegisterStore((state) => state.selectedMemoryMapId);
  const setSelectedMemoryMapId = useRegisterStore((state) => state.setSelectedMemoryMapId);
  const error = useRegisterStore((state) => state.error);

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchDialog(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine active address block and registers (Moved up to be available for handlers)
  const activeMemoryMap = currentProject?.memoryMaps?.find(mm => mm.id === selectedMemoryMapId);
  const allAddressBlocks = currentProject?.memoryMaps?.flatMap(mm => mm.addressBlocks || []) || [];
  const currentAddressBlock = allAddressBlocks.find(ab => ab.id === selectedAddressBlockId);
  const registers = currentAddressBlock?.registers || [];

  // Determine display register (for editor)
  // const displayRegister = selectedRegister || registers.find((r: Register) => r.id === selectedRegisterId) || registers[0]; // Not really needed if we only show selectedRegister

  useEffect(() => {
    if (id && currentProject?.id !== id) {
      fetchProject(id);
    }
  }, [id, fetchProject, currentProject?.id]);

  if (error) return <div className="h-full flex items-center justify-center text-red-500">Error: {error}</div>;
  if (isLoading && !currentProject) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>;
  if (!currentProject) return <div className="h-full flex items-center justify-center"><p className="text-surface-400">Project not found</p></div>;

  // Breadcrumbs Component
  const Breadcrumbs = () => (
    <div className="flex items-center text-sm text-surface-400 mb-6 overflow-x-auto whitespace-nowrap px-1">
      <button
        onClick={() => {
          setSelectedMemoryMapId(null);
          setSelectedAddressBlockId(null);
          setSelectedRegister(null);
        }}
        className="hover:text-primary-400 transition-colors flex items-center gap-1"
      >
        <span className="w-2 h-2 rounded-full bg-surface-600 block" />
        {currentProject.name}
      </button>

      {activeMemoryMap && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-surface-600" />
          <button
            onClick={() => {
              setSelectedAddressBlockId(null);
              setSelectedRegister(null);
            }}
            className={!currentAddressBlock ? "text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded" : "hover:text-primary-400 transition-colors"}
          >
            {activeMemoryMap.name}
          </button>
        </>
      )}

      {currentAddressBlock && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-surface-600" />
          <button
            onClick={() => {
              setSelectedRegister(null);
            }}
            className={!selectedRegister ? "text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded" : "hover:text-primary-400 transition-colors"}
          >
            {currentAddressBlock.name}
          </button>
        </>
      )}

      {selectedRegister && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-surface-600" />
          <span className="text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded">
            {selectedRegister.name}
          </span>
        </>
      )}
    </div>
  );

  // Render Content based on selection hierarchy
  const renderContent = () => {
    // 1. Register View (Deepest)
    if (selectedRegister) {
      return (
        <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in duration-300">
          <div className="card p-0 flex-1 overflow-hidden flex flex-col border-surface-700/50 shadow-sm">
            <div className="p-6 border-b border-surface-700/50 bg-surface-800/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium text-surface-100 tracking-tight">
                    {selectedRegister.displayName || selectedRegister.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-mono text-surface-400 bg-surface-800 px-2 py-0.5 rounded border border-surface-700/50">
                      0x{parseNumber(selectedRegister.addressOffset).toString(16).toUpperCase().padStart(2, "0")}
                    </span>
                    <span className="text-sm text-surface-400 border-l border-surface-700 pl-3">
                      {selectedRegister.description || t("project_view.no_desc_short")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-surface-900/50">
              <InteractiveBitFieldEditor
                registerId={selectedRegister.id}
                fields={selectedRegister.fields || []}
                registerSize={selectedRegister.size}
                readOnly={true}
                onFieldClick={() => { }} // Could show details modal
              />
            </div>
          </div>
        </div>
      );
    }

    // 2. Address Block View (Registers List)
    if (currentAddressBlock) {
      return (
        <div className="overflow-hidden card bg-surface-900 flex flex-col max-h-full">
          <div className="p-4 border-b border-surface-700 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-medium text-surface-200">{t("project_view.registers_title")}</h2>
              <p className="text-surface-400 text-xs mt-0.5">{t("project_view.registers_desc", { name: currentAddressBlock.name })}</p>
            </div>
            {/* Read only: No Add Register Button */}
          </div>

          {registers.length > 0 ? (
            <div className="overflow-auto">
              <RegisterTable
                registers={registers}
                onSelect={(reg) => {
                  setSelectedRegister(reg);
                }}
              // ReadOnly: No onEdit/onDelete
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-900/50">
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 text-surface-400">
                <SettingsIcon className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-surface-200 mb-2">{t("project_view.no_registers_title")}</h3>
              <p className="text-surface-400 mb-6 max-w-sm">{t("project_view.no_registers_desc")}</p>
            </div>
          )}
        </div>
      );
    }

    // 3. Memory Map View (Address Blocks List)
    if (activeMemoryMap) {
      return (
        <div className="overflow-hidden card bg-surface-900 flex flex-col max-h-full">
          <div className="p-4 border-b border-surface-700 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-medium text-surface-200">{t("project_view.blocks_title")}</h2>
              <p className="text-surface-400 text-xs mt-0.5">{t("project_view.blocks_desc", { name: activeMemoryMap.name })}</p>
            </div>
            {/* ReadOnly: No Add Block Button */}
          </div>

          {activeMemoryMap.addressBlocks && activeMemoryMap.addressBlocks.length > 0 ? (
            <div className="overflow-auto">
              <AddressBlockTable
                addressBlocks={activeMemoryMap.addressBlocks}
                onSelect={(block) => setSelectedAddressBlockId(block.id)}
              // ReadOnly
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-900/50">
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 text-surface-400">
                <SettingsIcon className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-surface-200 mb-2">{t("project_view.no_blocks_title")}</h3>
              <p className="text-surface-400 mb-6 max-w-sm">{t("project_view.no_blocks_desc")}</p>
            </div>
          )}
        </div>
      );
    }

    // 4. Project Root View
    return (
      <div className="flex-1 overflow-auto space-y-8 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-8 border-surface-700/50 shadow-sm hover:border-primary-500/30 transition-colors cursor-default">
            <h3 className="text-xl font-medium text-surface-100 mb-6 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary-400" />
              {t("project_view.project_details")}
            </h3>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">{t("project_view.project_name")}</label>
                <div className="text-surface-100 font-mono text-lg bg-surface-800/50 px-4 py-3 rounded-lg border border-surface-700/50">
                  {currentProject.name}
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">{t("project_view.description")}</label>
                <div className="text-surface-300 bg-surface-800/50 px-4 py-3 rounded-lg border border-surface-700/50 min-h-[80px]">
                  {currentProject.description || t("project_view.no_description")}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-8 border-surface-700/50 shadow-sm">
              <h3 className="text-xl font-medium text-surface-100 mb-6">{t("project_view.quick_actions")}</h3>
              <div className="grid grid-cols-1 gap-4">
                <button
                  className="bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:border-primary-500/50 group text-left"
                  onClick={() => setShowExportDialog(true)}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-900 flex items-center justify-center text-primary-400 group-hover:text-primary-300">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{t("project_view.export_project")}</div>
                    <div className="text-sm text-surface-400 mt-0.5">{t("project_view.export_desc")}</div>
                  </div>
                </button>
                <button
                  className="bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.01] hover:border-primary-500/50 group text-left"
                  onClick={() => setShowPropertyPanel(true)}
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-900 flex items-center justify-center text-primary-400 group-hover:text-primary-300">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{t("project_view.project_settings")}</div>
                    <div className="text-sm text-surface-400 mt-0.5">{t("project_view.settings_desc")}</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-surface-950">

      {/* Top Bar - Clean & Minimal */}
      <div className="h-16 border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="font-bold text-white text-lg">R</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-semibold text-surface-100 leading-tight tracking-tight">{currentProject.name}</h1>
            <span className="text-[10px] uppercase tracking-wider text-surface-400 font-medium">{t("project_view.subtitle")}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSearchDialog(true)}
            className="btn-secondary rounded-lg border-surface-600 hover:border-surface-500 text-surface-200 px-3 min-w-[200px] justify-between group hidden md:flex"
            title="Search (Cmd+K)"
          >
            <span className="flex items-center gap-2 text-surface-400 group-hover:text-surface-300">
              <Search className="w-4 h-4" />
              Search...
            </span>
            <span className="text-xs text-surface-500 bg-surface-800 px-1.5 py-0.5 rounded border border-surface-700 font-mono">
              ⌘K
            </span>
          </button>
          <button
            onClick={() => setShowSearchDialog(true)}
            className="md:hidden btn-secondary rounded-lg border-surface-600 hover:border-surface-500 text-surface-200"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="btn-secondary rounded-lg border-surface-600 hover:border-surface-500 text-surface-200 px-2"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-surface-700 bg-surface-800 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowExportDialog(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-surface-200 hover:bg-surface-700/50 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <Download className="w-4 h-4 text-primary-400" />
                      {t("project_view.export")}
                    </button>
                    <div className="h-px bg-surface-700/50 my-1.5" />
                    <button
                      onClick={() => {
                        setShowPropertyPanel(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-surface-200 hover:bg-surface-700/50 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <SettingsIcon className="w-4 h-4 text-surface-400" />
                      {t("common.settings")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden p-8 max-w-7xl mx-auto w-full">
          <Breadcrumbs />
          {renderContent()}
        </div>

        {/* Property Panel Sidebar */}
        {showPropertyPanel && (
          <div className="w-96 border-l border-surface-700 overflow-hidden bg-surface-900 absolute right-0 inset-y-0 z-50 shadow-2xl animate-in slide-in-from-right duration-300">
            <PropertyPanel
              entity={currentProject}
              entityType="project"
              onClose={() => setShowPropertyPanel(false)}
              readOnly={true} // Need to support this in PropertyPanel if we want it to be readonly, or just accept it's editable global properties. But viewers likely shouldn't edit project properties.
            // We'll leave it for now, assuming api blocks it.
            />
          </div>
        )}
      </div>

      {showExportDialog && (
        <ExportDialog
          projectId={currentProject.id}
          projectName={currentProject.name}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {showSearchDialog && (
        <GlobalSearchDialog onClose={() => setShowSearchDialog(false)} />
      )}
    </div>
  );
}
