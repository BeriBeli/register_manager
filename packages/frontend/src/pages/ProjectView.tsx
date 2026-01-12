import { useParams } from "react-router-dom";
import { RegisterTable } from "../components/register/RegisterTable";
import { BitFieldVisualizer } from "../components/register/BitFieldVisualizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Download, Plus, Settings } from "lucide-react";

// Mock data
const mockProject = {
  id: "1",
  name: "uart_controller",
  displayName: "UART Controller",
  vlnv: { vendor: "acme", library: "peripheral", name: "uart", version: "1.0" },
  memoryMaps: [
    {
      id: "mm1",
      name: "uart_regs",
      addressBlocks: [
        {
          id: "ab1",
          name: "control_block",
          baseAddress: "0x0000",
          range: "0x100",
          width: 32,
          registers: [
            {
              id: "r1",
              name: "CTRL",
              displayName: "Control Register",
              addressOffset: "0x00",
              size: 32,
              fields: [
                { id: "f1", name: "EN", bitOffset: 0, bitWidth: 1, access: "read-write", description: "Enable UART" },
                { id: "f2", name: "MODE", bitOffset: 1, bitWidth: 2, access: "read-write", description: "Operation mode" },
                { id: "f3", name: "PARITY", bitOffset: 3, bitWidth: 1, access: "read-write", description: "Parity enable" },
                { id: "f4", name: "STOP", bitOffset: 4, bitWidth: 2, access: "read-write", description: "Stop bits" },
                { id: "f5", name: "RESERVED", bitOffset: 6, bitWidth: 26, access: "read-only", description: "Reserved" },
              ],
            },
            {
              id: "r2",
              name: "STATUS",
              displayName: "Status Register",
              addressOffset: "0x04",
              size: 32,
              fields: [
                { id: "f6", name: "TX_EMPTY", bitOffset: 0, bitWidth: 1, access: "read-only", description: "TX FIFO empty" },
                { id: "f7", name: "RX_FULL", bitOffset: 1, bitWidth: 1, access: "read-only", description: "RX FIFO full" },
                { id: "f8", name: "TX_BUSY", bitOffset: 2, bitWidth: 1, access: "read-only", description: "TX busy" },
                { id: "f9", name: "ERROR", bitOffset: 3, bitWidth: 4, access: "read-only", description: "Error flags" },
              ],
            },
            {
              id: "r3",
              name: "BAUD",
              displayName: "Baud Rate Register",
              addressOffset: "0x08",
              size: 32,
              fields: [
                { id: "f10", name: "DIVISOR", bitOffset: 0, bitWidth: 16, access: "read-write", description: "Baud rate divisor" },
                { id: "f11", name: "FRAC", bitOffset: 16, bitWidth: 4, access: "read-write", description: "Fractional divisor" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export function ProjectView() {
  const { id } = useParams();
  const project = mockProject; // Will fetch from API
  const selectedRegister = project.memoryMaps[0].addressBlocks[0].registers[0];

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-100">
            {project.displayName}
          </h1>
          <div className="text-xs text-surface-500 font-mono mt-1">
            {project.vlnv.vendor}:{project.vlnv.library}:{project.vlnv.name}:{project.vlnv.version}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Plus className="w-4 h-4" />
            Add Register
          </button>
          <button className="btn-primary">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="registers" className="flex-1 flex flex-col">
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
            Bit Field View
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="px-4 py-2 text-sm text-surface-400 border-b-2 border-transparent data-[state=active]:text-primary-400 data-[state=active]:border-primary-400"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registers" className="flex-1">
          <RegisterTable registers={project.memoryMaps[0].addressBlocks[0].registers} />
        </TabsContent>

        <TabsContent value="bitfield" className="flex-1">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-surface-100 mb-4">
              {selectedRegister.displayName}
            </h3>
            <BitFieldVisualizer
              fields={selectedRegister.fields}
              registerSize={selectedRegister.size}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-surface-100 mb-4">Project Settings</h3>
            <p className="text-surface-400">Configure project settings here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
