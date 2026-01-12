import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, Clock, ChevronRight, Trash2 } from "lucide-react";
import { useRegisterStore } from "../stores/registerStore";
import { ProjectDialog } from "../components/project/ProjectDialog";

export function Dashboard() {
  const projects = useRegisterStore((state) => state.projects);
  const isLoading = useRegisterStore((state) => state.isLoading);
  const fetchProjects = useRegisterStore((state) => state.fetchProjects);
  const deleteProject = useRegisterStore((state) => state.deleteProject);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCloseDialog = () => {
    setShowProjectDialog(false);
    // Refresh projects list when dialog closes
    fetchProjects();
  };

  const totalRegisters = projects.reduce((acc, p) => {
    return acc + (p.memoryMaps?.reduce((sum, mm) => {
      return sum + (mm.addressBlocks?.reduce((s, ab) => s + (ab.registers?.length || 0), 0) || 0);
    }, 0) || 0);
  }, 0);

  const totalMemoryMaps = projects.reduce((acc, p) => acc + (p.memoryMaps?.length || 0), 0);

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
        <button className="btn-primary" onClick={() => setShowProjectDialog(true)}>
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
          <div className="text-2xl font-semibold text-surface-100">{totalRegisters}</div>
          <div className="text-sm text-surface-400">Registers</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-semibold text-surface-100">{totalMemoryMaps}</div>
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
        {isLoading ? (
          <div className="p-12 text-center text-surface-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-surface-400 mb-4">No projects yet</p>
            <button className="btn-primary" onClick={() => setShowProjectDialog(true)}>
              <Plus className="w-4 h-4" />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-800">
            {projects.map((project) => {
              const registerCount = project.memoryMaps?.reduce((sum, mm) => {
                return sum + (mm.addressBlocks?.reduce((s, ab) => s + (ab.registers?.length || 0), 0) || 0);
              }, 0) || 0;

              return (
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
                        {registerCount} registers
                      </div>
                      <div className="flex items-center gap-1 text-xs text-surface-500">
                        <Clock className="w-3 h-3" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete project "${project.name}" ? `)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="p-2 text-surface-500 hover:text-red-400 hover:bg-surface-700/50 rounded transition-colors z-10"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-surface-500 group-hover:text-surface-300 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Dialog */}
      {showProjectDialog && (
        <ProjectDialog onClose={handleCloseDialog} />
      )}
    </div>
  );
}
