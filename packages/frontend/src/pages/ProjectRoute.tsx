import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRegisterStore } from "../stores/registerStore";
import { useSession } from "../lib/auth-client";
import { ProjectView } from "./ProjectView";
import { ProjectViewer } from "./ProjectViewer";
import { Loader2 } from "lucide-react";

export function ProjectRoute() {
  const { id } = useParams();
  const { data: session } = useSession();
  const fetchProject = useRegisterStore((state) => state.fetchProject);
  const fetchProjectMembers = useRegisterStore((state) => state.fetchProjectMembers);

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"owner" | "editor" | "viewer" | null>(null);

  useEffect(() => {
    if (!id || !session?.user) return;

    const checkAccess = async () => {
      setLoading(true);

      try {
        await fetchProject(id);
        const project = useRegisterStore.getState().currentProject;

        if (!project) {
          setLoading(false);
          return;
        }

        if (project.userId === session.user.id) {
          setRole("owner");
          setLoading(false);
          return;
        }

        // Check members
        const members = await fetchProjectMembers(id);
        const member = members.find((m: any) => m.userId === session.user.id);

        if (member) {
          setRole(member.role);
        } else {
          // If not owner and not member, role remains null.
          // Backend likely handles 403, but here we just pass through to ProjectView 
          // which might show an error or readonly depending on how robust it is.
          // But we strictly want to catch "viewer" role.
        }
      } catch (err) {
        console.error("Error checking access:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [id, session?.user?.id, fetchProject, fetchProjectMembers]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (role === "viewer") {
    return <ProjectViewer />;
  }

  return <ProjectView />;
}
