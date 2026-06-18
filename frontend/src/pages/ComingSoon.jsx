/**
 * ComingSoon — placeholder for modules implemented in later phases
 * (AI Architect, Security Center, FinOps, Terraform, Kubernetes, etc.).
 */
import { useLocation, Link } from 'react-router-dom';
import Icon from '../components/ui/Icon.jsx';

export default function ComingSoon() {
  const { pathname } = useLocation();
  const name = pathname.replace('/', '').replace(/-/g, ' ').replace(/\//g, ' / ') || 'This module';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
        <Icon name="sparkles" className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-white">{name}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        This module is part of the platform roadmap and will be implemented in an
        upcoming phase. The navigation and access control are already wired up.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
