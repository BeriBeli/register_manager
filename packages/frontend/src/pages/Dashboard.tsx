import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, Clock, ChevronRight } from "lucide-react";

// Mock data - will be replaced with API calls
const mockProjects = [
  {
    id: "1",
    name: "uart_controller",
    displayName: "UART Controller",
    vlnv: { vendor: "acme", library: "peripheral", name: "uart", version: "1.0" },
    updatedAt: new Date("2024-01-10"),
    registerCount: 8,
  },
  {
    id: "2",
    name: "spi_master",
    displayName: "SPI Master",
    vlnv: { vendor: "acme", library: "peripheral", name: "spi", version: "2.1" },
    updatedAt: new Date("2024-01-09"),
    registerCount: 12,
  },
  {
    id: "3",
    name: "gpio_controller",
    displayName: "GPIO Controller",
    vlnv: { vendor: "acme", library: "peripheral", name: "gpio", version: "1.0" },
    updatedAt: new Date("2024-01-08"),
    registerCount: 4,
  },
];

export function Dashboard() {
  const [projects] = useState(mockProjects);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-100">Projects</h1>
          <p className="text-sm text-surface-400 mt-1">
            Manage your IP-XACT register definitions
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">{projects.length}</div>
          <div className="text-sm text-surface-400">Projects</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">
            {projects.reduce((acc, p) => acc + p.registerCount, 0)}
          </div>
          <div className="text-sm text-surface-400">Registers</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">3</div>
          <div className="text-sm text-surface-400">Memory Maps</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-primary-400">IP-XACT 2022</div>
          <div className="text-sm text-surface-400">Standard</div>
        </div>
      </div>

      {/* Projects List */}
      <div className="card">
        <div className="p-4 border-b border-surface-700">
          <h2 className="font-medium text-surface-200">Recent Projects</h2>
        </div>
        <div className="divide-y divide-surface-800">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="flex items-center justify-between p-4 hover:bg-surface-800/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <div className="font-medium text-surface-100">
                    {project.displayName || project.name}
                  </div>
                  <div className="text-xs text-surface-500 font-mono">
                    {project.vlnv.vendor}:{project.vlnv.library}:{project.vlnv.name}:{project.vlnv.version}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-surface-300">
                    {project.registerCount} registers
                  </div>
                  <div className="flex items-center gap-1 text-xs text-surface-500">
                    <Clock className="w-3 h-3" />
                    {project.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-500 group-hover:text-surface-300 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
