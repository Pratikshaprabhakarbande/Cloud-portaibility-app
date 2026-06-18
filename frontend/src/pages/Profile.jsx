/**
 * Profile page — view/edit name, organization, avatar URL, and change password.
 * Persists via PUT /api/auth/profile through AuthContext.updateProfile.
 */
import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import useNotification from '../hooks/useNotification.js';
import { Spinner } from '../components/ui/Loading.jsx';
import { getErrorMessage } from '../services/api.js';
import Badge from '../components/ui/Badge.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { notify } = useNotification();

  const [form, setForm] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
    avatarUrl: user?.avatarUrl || ''
  });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(form);
      notify.success('Profile updated');
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) {
      notify.error('New passwords do not match');
      return;
    }
    setSavingPwd(true);
    try {
      await updateProfile({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      notify.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>

      <div className="card flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <div className="mt-1"><Badge status="neutral">{user?.role}</Badge></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile details */}
        <form onSubmit={handleProfile} className="card space-y-4 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">Account details</h3>
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="org" className="label">Organization</label>
            <input id="org" className="input" value={form.organization} onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="avatar" className="label">Avatar URL</label>
            <input id="avatar" className="input" value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input opacity-60" value={user?.email || ''} disabled />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Spinner size="sm" className="text-white" /> : 'Save changes'}
          </button>
        </form>

        {/* Change password */}
        <form onSubmit={handlePassword} className="card space-y-4 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white">Change password</h3>
          <div>
            <label htmlFor="cur" className="label">Current password</label>
            <input id="cur" type="password" className="input" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="new" className="label">New password</label>
            <input id="new" type="password" className="input" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="conf" className="label">Confirm new password</label>
            <input id="conf" type="password" className="input" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
          </div>
          <p className="text-xs text-slate-400">Changing your password signs out other sessions.</p>
          <button type="submit" disabled={savingPwd} className="btn-primary">
            {savingPwd ? <Spinner size="sm" className="text-white" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
