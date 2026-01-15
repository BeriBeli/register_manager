import { X, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProjectMembers } from "./ProjectMembers";

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function ShareDialog({ projectId, projectName, onClose }: ShareDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-900 border border-surface-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-700 flex items-center justify-between bg-surface-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-surface-100">{t("project.share_title")}</h2>
              <p className="text-xs text-surface-400">{t("project.share_desc", { name: projectName })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <ProjectMembers projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
