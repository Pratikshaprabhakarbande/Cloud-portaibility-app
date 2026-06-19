/**
 * Admin User Management — lists users, roles, status. Uses the existing
 * seeded user data via a simple backend endpoint. Admin-only (route-gated).
 */
import useApi from '../hooks/useApi.js';
import api from '../services/api.js';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { PageLoader } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

async function fetchUsers() {
  const res = await api.get('/admin/users');
  return res.data.data;
}

export default function AdminUsers() {
  const users = useApi(fetchUsers, []);

  if (users.loading) return <PageLoader label="Loading users..." />;
  if (users.error) return <ErrorState message={users.error} onRetry={users.refetch} />;

  const list = users.data?.results || users.data || [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">View platform users, roles, and account status.</p>
      </header>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.map((u) => (
                <tr key={u.id || u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{u.name}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-5 py-3"><Badge status="neutral">{u.role}</Badge></td>
                  <td className="px-5 py-3"><Badge status={u.isActive ? 'operational' : 'outage'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-400">No users found.</div>}
      </div>
    </div>
  );
}
