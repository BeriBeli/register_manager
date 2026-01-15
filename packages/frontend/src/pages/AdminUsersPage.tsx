import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Shield, User, Clock, AlertCircle, Trash2, Lock, X, Key } from "lucide-react";
import { clsx } from "clsx";
import { useSession, authClient } from "../lib/auth-client";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
  banned: boolean;
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password Reset State
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Delete State
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await authClient.admin.listUsers({
        query: { limit: 100 }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        setUsers(data.users as unknown as User[]);
      }
    } catch (err: any) {
      setError(err.message || t("admin.users.messages.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users/${id}/approve`, {
        method: "POST",
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, approved: true } : u));
      }
    } catch {
      // Error handled silently - user sees no change in UI
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeleteUser(user);
  };

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    setDeleteLoading(true);

    try {
      const { error } = await authClient.admin.removeUser({
        userId: deleteUser.id
      });

      if (!error) {
        setUsers(users.filter(u => u.id !== deleteUser.id));
        setDeleteUser(null);
      } else {
        // Error: dialog stays open as feedback
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const openResetModal = (user: User) => {
    setResetUser(user);
    setNewPassword("");
    setResetError(null);
    setResetSuccess(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    setResetLoading(true);
    setResetError(null);

    try {
      const { error } = await authClient.admin.setUserPassword({
        userId: resetUser.id,
        newPassword: newPassword
      });

      if (!error) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetUser(null); // Close modal
        }, 1500);
      } else {
        setResetError(error.message || "Failed to reset password");
      }
    } catch (err) {
      setResetError("An error occurred");
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-surface-400">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleConfirmDelete}
        title={t("admin.users.actions.delete")}
        description={t("admin.users.messages.confirmDelete")}
        confirmText={t("admin.users.actions.delete")}
        isLoading={deleteLoading}
        variant="danger"
      />

      {/* Existing Reset Modal (unchanged) */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-900 border border-surface-800 rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setResetUser(null)}
              className="absolute top-4 right-4 text-surface-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-400" />
              {t("admin.users.resetModal.title")}
            </h3>

            <p className="text-sm text-surface-400 mb-4">
              {t("admin.users.resetModal.description", { name: resetUser.name })}
            </p>

            <form onSubmit={handleResetSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("admin.users.resetModal.placeholder")}
                  className="w-full bg-surface-800 border-surface-700 rounded-md px-3 py-2 text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  minLength={8}
                  required
                />
              </div>

              {resetError && (
                <div className="text-xs text-red-400 bg-red-900/10 p-2 rounded mb-4">
                  {resetError}
                </div>
              )}

              {resetSuccess ? (
                <div className="text-xs text-green-400 bg-green-900/10 p-2 rounded mb-4">
                  {t("admin.users.resetModal.success")}
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetUser(null)}
                    className="px-3 py-1.5 text-sm text-surface-400 hover:text-white"
                  >
                    {t("admin.users.actions.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {resetLoading ? t("admin.users.actions.resetting") : t("admin.users.actions.reset")}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-50 mb-2">{t("admin.users.title")}</h1>
        <p className="text-surface-400">{t("admin.users.subtitle")}</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-900/20 border border-red-800 text-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-surface-900 border border-surface-800 rounded-lg overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-800/50 text-surface-400 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">{t("admin.users.table.user")}</th>
              <th className="px-6 py-4">{t("admin.users.table.role")}</th>
              <th className="px-6 py-4">{t("admin.users.table.status")}</th>
              <th className="px-6 py-4">{t("admin.users.table.joined")}</th>
              <th className="px-6 py-4 text-right">{t("admin.users.table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-surface-400 font-bold border border-surface-700">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-surface-100">{user.name}</div>
                      <div className="text-surface-500 text-xs">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    user.role === "admin"
                      ? "bg-purple-900/30 text-purple-300 border-purple-800"
                      : "bg-surface-800 text-surface-300 border-surface-700"
                  )}>
                    {user.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    user.approved
                      ? "bg-green-900/30 text-green-300 border-green-800"
                      : "bg-yellow-900/30 text-yellow-300 border-yellow-800"
                  )}>
                    {user.approved ? t("admin.users.status.active") : t("admin.users.status.pending")}
                  </span>
                </td>
                <td className="px-6 py-4 text-surface-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!user.approved && (
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                        title={t("admin.users.actions.approve")}
                      >
                        <Check className="w-3 h-3" />
                        {t("admin.users.actions.approve")}
                      </button>
                    )}

                    {session?.user?.id !== user.id && (
                      <>
                        <button
                          onClick={() => openResetModal(user)}
                          className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-700 rounded-md transition-colors"
                          title={t("admin.users.actions.resetPassword")}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                          title={t("admin.users.actions.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-surface-500">
                  {t("admin.users.messages.noUsers")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
