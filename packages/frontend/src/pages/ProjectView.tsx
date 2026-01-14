import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RegisterTable } from "../components/register/RegisterTable";
import { InteractiveBitFieldEditor } from "../components/register/InteractiveBitFieldEditor";
import { RegisterDialog } from "../components/register/RegisterDialog";
import { FieldDialog } from "../components/register/FieldDialog";
import { FieldEditDialog } from "../components/register/FieldEditDialog";
import { AddressBlockTable } from "../components/address/AddressBlockTable";
import { PropertyPanel } from "../components/property/PropertyPanel";
import { ExportDialog } from "../components/export/ExportDialog";
import { CreateAddressBlockDialog } from "../components/project/CreateAddressBlockDialog";
import { AddressBlockDialog } from "../components/project/AddressBlockDialog";
import { useRegisterStore } from "../stores/registerStore";
import { Download, Plus, Loader2, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import type { Field, Register, AddressBlock } from "@register-manager/shared";
import { parseNumber } from "@register-manager/shared";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

export function ProjectView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const currentProject = useRegisterStore((state) => state.currentProject);
  const isLoading = useRegisterStore((state) => state.isLoading);
  const fetchProject = useRegisterStore((state) => state.fetchProject);
  const deleteRegister = useRegisterStore((state) => state.deleteRegister);
  const deleteAddressBlock = useRegisterStore((state) => state.deleteAddressBlock);
  const selectedRegister = useRegisterStore((state) => state.selectedRegister);
  const setSelectedRegister = useRegisterStore((state) => state.setSelectedRegister);
  const selectedAddressBlockId = useRegisterStore((state) => state.selectedAddressBlockId);
  const setSelectedAddressBlockId = useRegisterStore((state) => state.setSelectedAddressBlockId);
  const setSelectedMemoryMapId = useRegisterStore((state) => state.setSelectedMemoryMapId);
  const error = useRegisterStore((state) => state.error);

  // Delete State
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    type: "register" | "addressBlock";
    name: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newFieldInitialData, setNewFieldInitialData] = useState<{ offset: number; width: number } | null>(null);
  const [editingRegister, setEditingRegister] = useState<Register | null>(null);
  const [currentAddressBlockId, setCurrentAddressBlockId] = useState<string | null>(null);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // New state for Address Block Editing
  const [editingAddressBlock, setEditingAddressBlock] = useState<AddressBlock | null>(null);
  const [showAddressBlockDialog, setShowAddressBlockDialog] = useState(false);
  const [targetMemoryMapId, setTargetMemoryMapId] = useState<string | null>(null);

  // Determine active address block and registers (Moved up to be available for handlers)
  const activeMemoryMap = currentProject?.memoryMaps?.find(mm => mm.id === useRegisterStore.getState().selectedMemoryMapId);
  const allAddressBlocks = currentProject?.memoryMaps?.flatMap(mm => mm.addressBlocks || []) || [];
  const currentAddressBlock = allAddressBlocks.find(ab => ab.id === selectedAddressBlockId);
  const registers = currentAddressBlock?.registers || [];

  const handleEditRegister = (register: Register) => {
    setEditingRegister(register);
    setShowRegisterDialog(true);
  };

  const handleCloseRegisterDialog = () => {
    setShowRegisterDialog(false);
    setEditingRegister(null);
  };

  const handleDeleteRegister = (id: string) => {
    const reg = registers.find(r => r.id === id);
    if (reg) {
      setDeleteItem({ id, type: "register", name: reg.name });
    }
  };

  const handleEditAddressBlock = (block: AddressBlock) => {
    setEditingAddressBlock(block);
    setShowAddressBlockDialog(true);
  };

  const handleDeleteAddressBlock = (id: string) => {
    const block = allAddressBlocks.find(ab => ab.id === id);
    if (block) {
      setDeleteItem({ id, type: "addressBlock", name: block.name });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      if (deleteItem.type === "register") {
        await deleteRegister(deleteItem.id);
      } else {
        await deleteAddressBlock(deleteItem.id);
        if (currentAddressBlockId === deleteItem.id) {
          setCurrentAddressBlockId(null);
          if (selectedAddressBlockId === deleteItem.id) {
            setSelectedAddressBlockId(null);
          }
        }
      }
      setDeleteItem(null);
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateAddressBlock = (memoryMapId: string) => {
    setTargetMemoryMapId(memoryMapId);
    setEditingAddressBlock(null);
    setShowAddressBlockDialog(true);
  };

  // Determine display register (for editor)
  const displayRegister = selectedRegister || registers.find((r: Register) => r.id === selectedRegisterId) || registers[0];

  const handleRangeSelected = (startBit: number, endBit: number) => {
    if (displayRegister) {
      setSelectedRegister(displayRegister);
      setNewFieldInitialData({
        offset: startBit,
        width: endBit - startBit + 1
      });
      setEditingField(null); // Ensure not in edit mode
      setShowFieldDialog(true);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id, fetchProject]);

  if (error) return <div className="h-full flex items-center justify-center text-red-500">Error: {error}</div>;
  if (isLoading && !currentProject) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-400" /></div>;
  if (!currentProject) return <div className="h-full flex items-center justify-center"><p className="text-surface-400">Project not found</p></div>;

  const handleAddRegister = () => {
    if (currentAddressBlock) {
      setCurrentAddressBlockId(currentAddressBlock.id);
      setShowRegisterDialog(true);
    }
  };

  const handleAddField = () => {
    if (displayRegister) {
      setSelectedRegister(displayRegister);
      setNewFieldInitialData(null);
      setEditingField(null);
      setShowFieldDialog(true);
    }
  };

  const handleFieldClick = (field: Field) => {
    setEditingField(field);
  };

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
                onFieldClick={handleFieldClick}
                onAddField={handleAddField}
                onRangeSelected={handleRangeSelected}
              />
            </div>
          </div>
        </div>
      );
    }

    // 2. Address Block View (Registers List)
    if (currentAddressBlock) {
      return (
        <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-surface-100">{t("project_view.registers_title")}</h2>
              <p className="text-surface-400 text-sm mt-1">{t("project_view.registers_desc", { name: currentAddressBlock.name })}</p>
            </div>
            <button
              onClick={() => {
                setCurrentAddressBlockId(currentAddressBlock.id);
                setShowRegisterDialog(true);
              }}
              className="btn-primary shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("project_view.add_register")}
            </button>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-surface-700/50 shadow-sm bg-surface-800/20">
            {registers.length > 0 ? (
              <div className="h-full overflow-auto">
                <RegisterTable
                  registers={registers}
                  onSelect={(reg) => {
                    setSelectedRegister(reg);
                  }}
                  onEdit={handleEditRegister}
                  onDelete={handleDeleteRegister}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-surface-900/50">
                <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 text-surface-400">
                  <SettingsIcon className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-surface-200 mb-2">{t("project_view.no_registers_title")}</h3>
                <p className="text-surface-400 mb-6 max-w-sm">{t("project_view.no_registers_desc")}</p>
                <button onClick={() => {
                  setCurrentAddressBlockId(currentAddressBlock.id);
                  setShowRegisterDialog(true);
                }} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("project_view.create_first_register")}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. Memory Map View (Address Blocks List)
    if (activeMemoryMap) {
      return (
        <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-surface-100">{t("project_view.blocks_title")}</h2>
              <p className="text-surface-400 text-sm mt-1">{t("project_view.blocks_desc", { name: activeMemoryMap.name })}</p>
            </div>
            <button
              onClick={() => handleCreateAddressBlock(activeMemoryMap.id)}
              className="btn-primary shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("project_view.add_block")}
            </button>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border border-surface-700/50 shadow-sm bg-surface-800/20">
            {activeMemoryMap.addressBlocks && activeMemoryMap.addressBlocks.length > 0 ? (
              <div className="h-full overflow-auto">
                <AddressBlockTable
                  addressBlocks={activeMemoryMap.addressBlocks}
                  onSelect={(block) => setSelectedAddressBlockId(block.id)}
                  onEdit={handleEditAddressBlock}
                  onDelete={handleDeleteAddressBlock}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-surface-900/50">
                <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 text-surface-400">
                  <SettingsIcon className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-surface-200 mb-2">{t("project_view.no_blocks_title")}</h3>
                <p className="text-surface-400 mb-6 max-w-sm">{t("project_view.no_blocks_desc")}</p>
                <button
                  onClick={() => handleCreateAddressBlock(activeMemoryMap.id)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("project_view.create_first_block")}
                </button>
              </div>
            )}
          </div>
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
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title={deleteItem?.type === "register" ? t("project.delete_register.title") : t("project.delete_block.title")}
        description={deleteItem?.type === "register"
          ? t("project.delete_register.desc", { name: deleteItem?.name })
          : t("project.delete_block.desc", { name: deleteItem?.name })
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteLoading}
      />

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
            onClick={() => setShowPropertyPanel(true)}
            className="btn-ghost text-surface-400 hover:text-surface-100 hover:bg-surface-800/50 transition-all rounded-lg px-3 py-2"
            title={t("common.settings")}
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            className="btn-secondary rounded-lg border-surface-600 hover:border-surface-500 text-surface-200"
          >
            <Download className="w-4 h-4 mr-2" />
            {t("project_view.export")}
          </button>
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
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showRegisterDialog && currentAddressBlockId && (
        <RegisterDialog
          addressBlockId={currentAddressBlockId}
          onClose={(newId) => {
            handleCloseRegisterDialog();
            if (newId) {
              setSelectedRegisterId(newId);
            }
          }}
          editingRegister={editingRegister}
        />
      )}

      {showFieldDialog && displayRegister && (
        <FieldDialog
          registerId={selectedRegisterId || displayRegister.id}
          registerSize={displayRegister.size}
          initialBitOffset={newFieldInitialData?.offset}
          initialBitWidth={newFieldInitialData?.width}
          onClose={() => setShowFieldDialog(false)}
        />
      )}

      {editingField && displayRegister && (
        <FieldEditDialog
          field={editingField}
          registerSize={displayRegister.size}
          onClose={() => setEditingField(null)}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          projectId={currentProject.id}
          projectName={currentProject.name}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* Address Block Dialog (Create & Edit) */}
      {showAddressBlockDialog && (
        <AddressBlockDialog
          memoryMapId={targetMemoryMapId || undefined}
          initialData={editingAddressBlock || undefined}
          onClose={(newId) => {
            setShowAddressBlockDialog(false);
            setEditingAddressBlock(null);
            setTargetMemoryMapId(null);
            if (newId) {
              if (!editingAddressBlock) {
                setSelectedAddressBlockId(newId);
              }
            }
          }}
        />
      )}
    </div>
  );
}
