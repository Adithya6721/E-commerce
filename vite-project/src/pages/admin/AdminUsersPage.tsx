import { useEffect, useState } from "react";
import { RefreshCw, Shield, Users } from "lucide-react";
import {
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
  formatApiError,
} from "@/components/admin/AdminUi";
import { getUsers, getUserSummary, type UserRecord, type UserSummary } from "@/services/userService";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadUsersPage = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [userData, userSummary] = await Promise.all([getUsers(), getUserSummary()]);
      setUsers(userData);
      setSummary(userSummary);
    } catch (error) {
      setLoadError(formatApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsersPage();
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Users"
        title="Review user accounts and roles"
        description="This page shows who is registered and whether the users API is working. If the list is empty because of a backend issue, the exact request failure is shown below."
        action={
          <button
            onClick={() => void loadUsersPage()}
            className="inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Users
          </button>
        }
      />

      {loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          User page could not load backend data: {loadError}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard title="Total Users" value={summary?.totalUsers ?? "Unavailable"} detail="All registered accounts" icon={<Users className="h-5 w-5" />} />
        <AdminStatCard title="Admins" value={summary?.totalAdmins ?? "Unavailable"} detail="Privileged accounts" icon={<Shield className="h-5 w-5" />} />
        <AdminStatCard title="Customers" value={summary?.totalCustomers ?? "Unavailable"} detail="Storefront users" icon={<Users className="h-5 w-5" />} />
      </section>

      <AdminPanel title="User List">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">No users were returned by the backend.</p>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Username</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{user.username}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          user.role === "ADMIN"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
