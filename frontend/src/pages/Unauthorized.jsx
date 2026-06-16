import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';

export default function Unauthorized() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
        <Icon name="shield" className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access denied</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Your role doesn&apos;t have permission to view this page.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
