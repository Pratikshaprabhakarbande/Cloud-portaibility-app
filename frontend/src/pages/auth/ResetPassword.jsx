import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { Spinner } from '../../components/ui/Loading.jsx';
import authService from '../../services/auth.service.js';
import useNotification from '../../hooks/useNotification.js';
import { getErrorMessage } from '../../services/api.js';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [form, setForm] = useState({ token: params.get('token') || '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(form.token, form.password);
      notify.success('Password reset. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="token" className="label">Reset token</label>
          <input id="token" name="token" type="text" required className="input" value={form.token} onChange={handleChange} placeholder="Paste your reset token" />
        </div>
        <div>
          <label htmlFor="password" className="label">New password</label>
          <input id="password" name="password" type="password" required className="input" value={form.password} onChange={handleChange} placeholder="••••••••" />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input id="confirm" name="confirm" type="password" required className="input" value={form.confirm} onChange={handleChange} placeholder="••••••••" />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <Spinner size="sm" className="text-white" /> : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}
