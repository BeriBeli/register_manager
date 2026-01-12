import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { RegisterTable } from "../components/register/RegisterTable";
import { InteractiveBitFieldEditor } from "../components/register/InteractiveBitFieldEditor";
import { RegisterDialog } from "../components/register/RegisterDialog";
import { FieldDialog } from "../components/register/FieldDialog";
import { FieldEditDialog } from "../components/register/FieldEditDialog";
import { AddressMapView } from "../components/address/AddressMapView";
import { AddressMapVisualizer } from "../components/address/AddressMapVisualizer";
import { PropertyPanel } from "../components/property/PropertyPanel";
import { ExportDialog } from "../components/export/ExportDialog";
import { useRegisterStore } from "../stores/registerStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Download, Plus, Loader2, Settings as SettingsIcon } from "lucide-react";
import type { Field, Register } from "@register-manager/shared";
import { parseNumber } from "@register-manager/shared";

export function ProjectView() {
  const { id } = useParams();
  const currentProject = useRegisterStore((state) => state.currentProject);
  const isLoading = useRegisterStore((state) => state.isLoading);
  const fetchProject = useRegisterStore((state) => state.fetchProject);
  const deleteRegister = useRegisterStore((state) => state.deleteRegister);
  const selectedRegister = useRegisterStore((state) => state.selectedRegister);
  const setSelectedRegister = useRegisterStore((state) => state.setSelectedRegister);
  const selectedAddressBlockId = useRegisterStore((state) => state.selectedAddressBlockId);
  const setSelectedAddressBlockId = useRegisterStore((state) => state.setSelectedAddressBlockId);
  const error = useRegisterStore((state) => state.error);

  const handleDeleteRegister = async (id: string) => {
    if (confirm("Are you sure you want to delete this register?")) {
      await deleteRegister(id);
    }
  };

  const handleEditRegister = (register: Register) => {
    setEditingRegister(register);
    setShowRegisterDialog(true);
  };

  const handleCloseRegisterDialog = () => {
    setShowRegisterDialog(false);
    setEditingRegister(null);
  };
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [newFieldInitialData, setNewFieldInitialData] = useState<{ offset: number; width: number } | null>(null);
  const [editingRegister, setEditingRegister] = useState<Register | null>(null);
  const [currentAddressBlockId, setCurrentAddressBlockId] = useState<string | null>(null);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Determine active address block and registers
  const allAddressBlocks = currentProject?.memoryMaps?.flatMap(mm => mm.addressBlocks || []) || [];

  let currentAddressBlock = allAddressBlocks.find(ab => ab.id === selectedAddressBlockId);

  // Default to first address block if none selected
  if (!currentAddressBlock && allAddressBlocks.length > 0) {
    currentAddressBlock = allAddressBlocks[0];
  }

  // Sync selectedAddressBlockId with store on mount or change
  useEffect(() => {
    if (currentAddressBlock && currentAddressBlock.id !== selectedAddressBlockId) {
      setSelectedAddressBlockId(currentAddressBlock.id);
    }
  }, [currentAddressBlock?.id, selectedAddressBlockId, setSelectedAddressBlockId]);

  const registers = currentAddressBlock?.registers || [];

  // Determine display register (for editor)
  // 1. Store selected (from tree)
  // 2. Local state selected (from table)
  // 3. First in list
  const displayRegister = selectedRegister || registers.find((r) => r.id === selectedRegisterId) || registers[0];

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

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (isLoading && !currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-400">Project not found</p>
        </div>
      </div>
    );
  }

  const handleAddRegister = () => {
    if (currentAddressBlock) {
      setCurrentAddressBlockId(currentAddressBlock.id);
      setShowRegisterDialog(true);
    }
  };

  const handleAddField = () => {
    if (displayRegister) {
      // Ensure the register is selected in store too, for consistency
      setSelectedRegister(displayRegister);
      setNewFieldInitialData(null);
      setEditingField(null);
      setShowFieldDialog(true);
    }
  };

  const handleFieldClick = (field: Field) => {
    setEditingField(field);
  };

  return (
    <div className="h-full flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Project Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-surface-100">
              {currentProject.displayName || currentProject.name}
            </h1>
            <div className="text-xs text-surface-500 font-mono mt-1">
              {currentProject.vlnv.vendor}:{currentProject.vlnv.library}:{currentProject.vlnv.name}:
              {currentProject.vlnv.version}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddRegister}
              className="btn-secondary"
              disabled={!currentAddressBlock}
            >
              <Plus className="w-4 h-4" />
              Add Register
            </button>
            <button
              onClick={() => setShowPropertyPanel(!showPropertyPanel)}
              className={`btn-secondary ${showPropertyPanel ? "bg-primary-600/20" : ""}`}
            >
              <SettingsIcon className="w-4 h-4" />
              Properties
            </button>
            <button className="btn-primary" onClick={() => setShowExportDialog(true)}>
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="registers" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex border-b border-surface-700 mb-4">
            <TabsTrigger
              value="registers"
              className="px-4 py-2 text-sm text-surface-400 border-b-2 border-transparent data-[state=active]:text-primary-400 data-[state=active]:border-primary-400"
            >
              Registers
            </TabsTrigger>
            <TabsTrigger
              value="bitfield"
              className="px-4 py-2 text-sm text-surface-400 border-b-2 border-transparent data-[state=active]:text-primary-400 data-[state=active]:border-primary-400"
            >
              Bit Field Editor
            </TabsTrigger>
            <TabsTrigger
              value="addressmap"
              className="px-4 py-2 text-sm text-surface-400 border-b-2 border-transparent data-[state=active]:text-primary-400 data-[state=active]:border-primary-400"
            >
              Address Map
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="px-4 py-2 text-sm text-surface-400 border-b-2 border-transparent data-[state=active]:text-primary-400 data-[state=active]:border-primary-400"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registers" className="flex-1 overflow-auto">
            {registers.length > 0 ? (
              <RegisterTable
                registers={registers}
                onEdit={handleEditRegister}
                onDelete={handleDeleteRegister}
              />
            ) : (
              <div className="card p-12 text-center">
                <p className="text-surface-400 mb-4">No registers yet</p>
                <button onClick={handleAddRegister} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Create First Register
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bitfield" className="flex-1 overflow-auto">
            {displayRegister ? (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-surface-100">
                      {displayRegister.displayName || displayRegister.name}
                    </h3>
                    <p className="text-sm text-surface-400 mt-1">
                      {displayRegister.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm font-mono bg-surface-800/50 px-2 py-1 rounded w-fit">
                      <span className="text-surface-500">Reset Value:</span>
                      <span className="text-primary-400">
                        {(() => {
                          try {
                            let val = 0n;
                            const currentFields = displayRegister.fields || [];
                            currentFields.forEach(f => {
                              // Safe check for resets array and content
                              if (Array.isArray(f.resets) && f.resets.length > 0 && f.resets[0]?.value) {
                                try {
                                  // Safe conversion
                                  const rawVal = parseNumber(f.resets[0].value);
                                  if (!isNaN(rawVal)) {
                                    const bitVal = BigInt(rawVal);
                                    const width = BigInt(Math.max(1, f.bitWidth || 1));
                                    const offset = BigInt(Math.max(0, f.bitOffset || 0));
                                    const mask = (1n << width) - 1n;
                                    val |= (bitVal & mask) << offset;
                                  }
                                } catch (inner) {
                                  // ignore invalid fields
                                }
                              }
                            });
                            const hexWidth = Math.ceil((displayRegister.size || 32) / 4);
                            return "0x" + val.toString(16).toUpperCase().padStart(hexWidth, "0");
                          } catch (e) { return "N/A"; }
                        })()}
                      </span>
                    </div>
                  </div>
                  {registers.length > 1 && (
                    <select
                      value={selectedRegisterId || displayRegister.id}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setSelectedRegisterId(newId);
                        const reg = registers.find(r => r.id === newId);
                        if (reg) setSelectedRegister(reg);
                      }}
                      className="input w-64"
                    >
                      {registers.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                          {reg.name} (0x{Number(reg.addressOffset).toString(16).toUpperCase().padStart(2, "0")})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <InteractiveBitFieldEditor
                  registerId={displayRegister.id}
                  fields={displayRegister.fields || []}
                  registerSize={displayRegister.size}
                  onFieldClick={handleFieldClick}
                  onAddField={handleAddField}
                  onRangeSelected={handleRangeSelected}
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <p className="text-surface-400 mb-4">No register selected</p>
                <button onClick={handleAddRegister} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Create First Register
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="addressmap" className="flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Tree View */}
              <div className="card overflow-hidden flex flex-col">
                <AddressMapView
                  project={currentProject}
                  onSelectRegister={(register) => setSelectedRegisterId(register.id)}
                  selectedRegisterId={selectedRegisterId}
                />
              </div>

              {/* Visual Map */}
              <div className="overflow-y-auto">
                <AddressMapVisualizer
                  project={currentProject}
                  onRegisterClick={(register) => setSelectedRegisterId(register.id)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-surface-100 mb-4">Project Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={currentProject.name}
                    className="input"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={currentProject.displayName || ""}
                    className="input"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={currentProject.description || ""}
                    className="input min-h-[80px]"
                    disabled
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Property Panel Sidebar */}
      {showPropertyPanel && (
        <div className="w-80 border-l border-surface-700 overflow-hidden">
          <PropertyPanel
            entity={currentProject}
            entityType="project"
            onClose={() => setShowPropertyPanel(false)}
          />
        </div>
      )}

      {/* Dialogs */}
      {showRegisterDialog && currentAddressBlockId && (
        <RegisterDialog
          addressBlockId={currentAddressBlockId}
          onClose={handleCloseRegisterDialog}
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
    </div>
  );
}
