/**
 * Settings page — appearance (theme) and user preferences (default provider,
 * email notifications). Preferences persist via PUT /api/auth/profile.
 */
import { useState } from 'react';
import useAuth from '../hooks/useAuth.js';
import useTheme from '../hooks/useTheme.js';
import useNotification from '../hooks/useNotification.js';
import { Spinner } from '../components/ui/Loading.jsx';
import { getErrorMessage } from '../services/api.js';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notify } = useNotification();

  const [prefs, setPrefs] = useState({
    defaultProvider: user?.preferences?.defaultProvider || 'aws',
    emailNotifications: user?.preferences?.emailNotifications ?? true
  });
  const [saving, setSaving] = useState(false);

  const savePrefs = async () => {
    setSaving(true);
    try {
      await updateProfile({ preferences: { ...prefs, theme } });
      notify.success('Settings saved');
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
    { key: 'system', label: 'System' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white">Appearance</h3>
        <p className="mb-4 text-sm text-slate-400">Choose how the dashboard looks.</p>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => t.key !== 'system' && setTheme(t.key)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                theme === t.key
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="card space-y-4 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white">Preferences</h3>
        <div>
          <label htmlFor="provider" className="label">Default cloud provider</label>
          <select
            id="provider"
            className="input max-w-xs"
            value={prefs.defaultProvider}
            onChange={(e) => setPrefs((p) => ({ ...p, defaultProvider: e.target.value }))}
          >
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={prefs.emailNotifications}
            onChange={(e) => setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Email notifications</span>
        </label>

        <button type="button" onClick={savePrefs} disabled={saving} className="btn-primary">
          {saving ? <Spinner size="sm" className="text-white" /> : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
