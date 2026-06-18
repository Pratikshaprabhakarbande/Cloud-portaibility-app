/**
 * DeploymentTable — responsive table of deployments (history / recent).
 * Collapses to stacked cards on small screens.
 */
import Badge from './Badge.jsx';

const PROVIDER_LABEL = { aws: 'AWS', azure: 'Azure', gcp: 'GCP' };

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export default function DeploymentTable({ deployments = [], title = 'Recent Deployments' }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-xs text-slate-400">{deployments.length} items</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Provider</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Ver</th>
              <th className="px-5 py-3 font-medium">By</th>
              <th className="px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {deployments.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{d.name}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{PROVIDER_LABEL[d.provider] || d.provider}</td>
                <td className="px-5 py-3 capitalize text-slate-600 dark:text-slate-300">{d.type}</td>
                <td className="px-5 py-3"><Badge status={d.status} /></td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">v{d.version}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{d.user}</td>
                <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">
        {deployments.map((d) => (
          <div key={d.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{d.name}</p>
              <p className="text-xs text-slate-400">
                {PROVIDER_LABEL[d.provider] || d.provider} · {d.type} · v{d.version}
              </p>
            </div>
            <Badge status={d.status} />
          </div>
        ))}
      </div>

      {deployments.length === 0 && (
        <div className="px-5 py-10 text-center text-sm text-slate-400">No deployments yet.</div>
      )}
    </div>
  );
}
