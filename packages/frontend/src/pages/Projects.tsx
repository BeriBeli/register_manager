import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Plus, FolderOpen, Clock, ChevronRight, Trash2, LayoutDashboard, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRegisterStore } from "../stores/registerStore";
import { ProjectDialog } from "../components/project/ProjectDialog";
import { ImportFromExcelDialog } from "../components/project/ImportFromExcelDialog";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { useSession } from "../lib/auth-client";

interface Project {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  vlnv: {
    vendor: string;
    library: string;
    name: string;
    version: string;
  };
  updatedAt: string;
}

export function Projects() {
  const { t } = useTranslation();
  const projects = useRegisterStore((state) => state.projects);
  const isLoading = useRegisterStore((state) => state.isLoading);
  const fetchProjects = useRegisterStore((state) => state.fetchProjects);
  const deleteProject = useRegisterStore((state) => state.deleteProject);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const navigate = useNavigate();
  const { data: session } = useSession();

  // Delete State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCloseDialog = () => {
    setShowProjectDialog(false);
    // Refresh projects list when dialog closes
    fetchProjects();
  };

  const handleDeleteClick = (project: any) => {
    setProjectToDelete(project);
  };

  const handleCloseImportDialog = () => {
    setShowImportDialog(false);
    fetchProjects();
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project", error);
      alert(t("common.error")); // Basic fallback if store doesn't handle error UI
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface-950">
      <ConfirmDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("project.delete_project.title")}
        description={t("project.delete_project.desc", { name: projectToDelete?.displayName || projectToDelete?.name })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* Dashboard Header */}
      <div className="h-16 border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-sm flex items-center justify-between px-8 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center border border-surface-700">
            <LayoutDashboard className="w-5 h-5 text-surface-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-semibold text-surface-100 leading-tight tracking-tight">{t('dashboard.title')}</h1>
            <span className="text-[10px] uppercase tracking-wider text-surface-400 font-medium">{t('dashboard.overview')}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 border-surface-700/50 shadow-sm bg-surface-800/20">
              <div className="text-2xl font-semibold text-surface-100">{projects.length}</div>
              <div className="text-sm text-surface-400">{t('dashboard.total_projects')}</div>
            </div>
          </div>

          {/* Projects List */}
          <div className="card">
            <div className="p-4 border-b border-surface-700 flex items-center justify-between">
              <h2 className="font-medium text-surface-200">{t('dashboard.recent_projects')}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="btn-secondary"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {t('dashboard.import_excel')}
                </button>
                <button
                  onClick={() => setShowProjectDialog(true)}
                  className="btn-primary shadow-lg shadow-primary-500/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('dashboard.new_project')}
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="p-12 text-center text-surface-400">{t('common.loading')}</div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-surface-400 mb-4">{t('dashboard.no_projects')}</p>
                <button className="btn-primary" onClick={() => setShowProjectDialog(true)}>
                  <Plus className="w-4 h-4" />
                  {t('dashboard.create_first')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-surface-800">
                {projects.map((project) => {

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
                          <div className="flex items-center gap-1 text-xs text-surface-500">
                            <Clock className="w-3 h-3" />
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </div>
                        </div>

                        {session?.user?.id === project.userId && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteClick(project);
                            }}
                            className="p-2 text-surface-500 hover:text-red-400 hover:bg-surface-700/50 rounded transition-colors z-10"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

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

          {/* Import Dialog */}
          {showImportDialog && (
            <ImportFromExcelDialog onClose={handleCloseImportDialog} />
          )}
        </div>
      </div>
    </div>
  );
}
