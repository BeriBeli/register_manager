import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRegisterStore } from "../../stores/registerStore";
import { ProjectMember } from "@register-manager/shared";
import { User, Trash2, Plus, BadgeCheck, AlertCircle } from "lucide-react";
import { useSession } from "../../lib/auth-client";
import { ConfirmDialog } from "../common/ConfirmDialog";

export function ProjectMembers({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { fetchProjectMembers, addProjectMember, removeProjectMember, currentProject } = useRegisterStore();
  const { data: session } = useSession();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Debug logic preserved but cleaner
  const isOwner = currentProject?.userId === session?.user?.id;
  const isAdmin = (session?.user as any)?.role === "admin";
  const canManage = isOwner || isAdmin;

  const loadMembers = async () => {
    try {
      const data = await fetchProjectMembers(projectId);
      setMembers(data);
    } catch (e) {
      console.error("Failed to load members", e);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      await addProjectMember(projectId, email, role);
      setEmail("");
      await loadMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveClick = (userId: string) => {
    setMemberToRemove(userId);
    setError(null);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await removeProjectMember(projectId, memberToRemove);
      await loadMembers();
      setMemberToRemove(null);
    } catch (err: any) {
      setError(err.message);
      setMemberToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-surface-400 uppercase tracking-wider">
          {t("project.members.title")}
        </h4>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Member List */}
        <div className="space-y-2">
          {/* Owner Display */}
          {currentProject?.user && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-300 overflow-hidden">
                  {currentProject.user.image ? (
                    <img
                      src={currentProject.user.image}
                      alt={currentProject.user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {currentProject.user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-200">
                    {currentProject.user.name}
                    {currentProject.userId === session?.user?.id && (
                      <span className="text-surface-500 text-xs ml-2">
                        ({t("project.members.you")})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-surface-500">
                    {currentProject.user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-500/10 text-xs font-medium text-primary-400 capitalize border border-primary-500/20">
                  <BadgeCheck className="w-3 h-3" />
                  Owner
                </div>
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div className="text-sm text-surface-500 italic py-2">
              {t("project.members.empty")}
            </div>
          )}

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-300 overflow-hidden">
                  {member.user.image ? (
                    <img src={member.user.image} alt={member.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{member.user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-200">
                    {member.user.name}
                    {member.userId === session?.user?.id && <span className="text-surface-500 text-xs ml-2">({t("project.members.you")})</span>}
                  </div>
                  <div className="text-xs text-surface-500">{member.user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-700/50 text-xs font-medium text-surface-300 capitalize">
                  {member.role === 'editor' ? <BadgeCheck className="w-3 h-3 text-primary-400" /> : <User className="w-3 h-3" />}
                  {t(`project.members.role.${member.role}`)}
                </div>

                {canManage && (
                  <button
                    onClick={() => handleRemoveClick(member.userId)}
                    className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title={t("project.members.remove")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Form */}
      {canManage && (
        <div className="pt-4 border-t border-surface-700/50">
          <h4 className="text-sm font-medium text-surface-400 mb-3 hover:text-surface-300 transition-colors">
            {t("project.members.add_title")}
          </h4>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("project.members.email_placeholder")}
                  className="w-full h-10 px-3 bg-surface-900 border border-surface-700 rounded-lg text-surface-200 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="h-10 px-3 bg-surface-900 border border-surface-700 rounded-lg text-surface-200 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="editor">{t("project.members.role.editor")}</option>
                <option value="viewer">{t("project.members.role.viewer")}</option>
              </select>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="h-10 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t("project.members.add")}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={t("project.members.remove")}
        description={t("project.members.confirm_remove")}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={isRemoving}
      />
    </div>
  );
}
