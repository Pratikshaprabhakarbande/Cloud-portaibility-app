import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { Spinner } from '../../components/ui/Loading.jsx';
import useAuth from '../../hooks/useAuth.js';
import useNotification from '../../hooks/useNotification.js';
import { getErrorMessage } from '../../services/api.js';

export default function Register() {
  const { register } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', organization: '' });
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
      const { confirm, ...payload } = form;
      void confirm;
      const user = await register(payload);
      notify.success(`Account created. Welcome, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your multi-cloud estate"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
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
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" name="name" type="text" required className="input" value={form.name} onChange={handleChange} placeholder="Ada Lovelace" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required className="input" value={form.email} onChange={handleChange} placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="organization" className="label">Organization <span className="text-slate-400">(optional)</span></label>
          <input id="organization" name="organization" type="text" className="input" value={form.organization} onChange={handleChange} placeholder="Acme Cloud" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" name="password" type="password" required className="input" value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          <div>
            <label htmlFor="confirm" className="label">Confirm</label>
            <input id="confirm" name="confirm" type="password" required className="input" value={form.confirm} onChange={handleChange} placeholder="••••••••" />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Min 8 characters with uppercase, lowercase, and a number. New accounts are created as <strong>Viewer</strong>.
        </p>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <Spinner size="sm" className="text-white" /> : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
