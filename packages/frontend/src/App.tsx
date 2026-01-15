import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { Projects } from "./pages/Projects";
import { ProjectRoute } from "./pages/ProjectRoute";
import { ProjectVersions } from "./pages/ProjectVersions";
import { AuthPage } from "./pages/AuthPage";
import { Clock } from "lucide-react";
import { useSession, signOut } from "./lib/auth-client";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-surface-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (!(session.user as any).approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
        <div className="max-w-md w-full bg-surface-900 border border-surface-800 rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-yellow-900/30 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-surface-100">Account Pending Approval</h2>
          <p className="text-surface-400">
            Your account is currently waiting for administrator approval.
            You cannot access the application until an administrator approves your account.
          </p>
          <div className="pt-4 border-t border-surface-800 flex justify-center">
            <button
              onClick={() => signOut().then(() => window.location.href = "/auth")}
              className="text-sm font-medium text-surface-400 hover:text-surface-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Public route wrapper (redirects to home if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-surface-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (session && (session.user as any).approved) {
    return <Navigate to="/" replace />;
  }

  // If session exists but not approved, we still allow Auth page? 
  // Probably better to redirect them to "/" which will show the "Pending Approval" screen.
  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Cast session.user to any to access role for now until types are regenerated
  if (!session || (session.user as any).role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Projects />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route path="users" element={<Navigate to="admin" replace />} />
        <Route path="project/:id" element={<ProjectRoute />} />
        <Route path="project/:id/versions" element={<ProjectVersions />} />
      </Route>
    </Routes>
  );
}

export default App;
