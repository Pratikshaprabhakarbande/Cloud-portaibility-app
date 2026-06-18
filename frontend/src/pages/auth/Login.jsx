import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { Spinner } from '../../components/ui/Loading.jsx';
import useAuth from '../../hooks/useAuth.js';
import useNotification from '../../hooks/useNotification.js';
import { getErrorMessage } from '../../services/api.js';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@demo.io', password: 'Admin@12345' },
  { label: 'Cloud Engineer', email: 'cloud@demo.io', password: 'Cloud@12345' },
  { label: 'DevOps', email: 'devops@demo.io', password: 'Devops@12345' },
  { label: 'Viewer', email: 'viewer@demo.io', password: 'Viewer@12345' }
];

export default function Login() {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const user = await login(form);
      notify.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (acct) => setForm({ email: acct.email, password: acct.password });

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your multi-cloud control plane"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" value={form.email} onChange={handleChange} placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" value={form.password} onChange={handleChange} placeholder="••••••••" />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <Spinner size="sm" className="text-white" /> : 'Sign in'}
        </button>
      </form>

      <div className="mt-6">
        <p className="mb-2 text-center text-xs text-slate-400">Quick demo login</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} type="button" onClick={() => fillDemo(a)} className="btn-secondary text-xs">
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
