/**
 * Deployment Detail — logs, config, status timeline, metadata.
 * Connected to: GET /api/deployments/:id
 */
import { useParams, Link } from 'react-router-dom';
import useApi from '../hooks/useApi.js';
import api from '../services/api.js';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { PageLoader } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

function fmt(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function DeploymentDetail() {
  const { id } = useParams();
  const dep = useApi(() => api.get(`/deployments/${id}`).then((r) => r.data.data), [id]);

  if (dep.loading) return <PageLoader label="Loading deployment..." />;
  if (dep.error) return <ErrorState message={dep.error} onRetry={dep.refetch} />;
  const d = dep.data;
  if (!d) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/deployments" className="text-brand-600 hover:underline text-sm">← Deployments</Link>
      </div>
      <header className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{d.name}</h2>
        <Badge status={d.status} />
        <span className="text-xs text-slate-400">v{d.version}</span>
      </header>

      {/* Metadata */}
      <div className="card grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 text-sm">
        <div><span className="text-slate-400">Provider</span><p className="font-medium uppercase text-slate-800 dark:text-slate-200">{d.provider}</p></div>
        <div><span className="text-slate-400">Type</span><p className="font-medium capitalize text-slate-800 dark:text-slate-200">{d.type}</p></div>
        <div><span className="text-slate-400">Region</span><p className="font-medium text-slate-800 dark:text-slate-200">{d.region || '—'}</p></div>
        <div><span className="text-slate-400">Duration</span><p className="font-medium text-slate-800 dark:text-slate-200">{d.durationMs ? `${(d.durationMs / 1000).toFixed(1)}s` : '—'}</p></div>
        <div><span className="text-slate-400">Started</span><p className="font-medium text-slate-800 dark:text-slate-200">{fmt(d.startedAt)}</p></div>
        <div><span className="text-slate-400">Finished</span><p className="font-medium text-slate-800 dark:text-slate-200">{d.finishedAt ? fmt(d.finishedAt) : '—'}</p></div>
        <div><span className="text-slate-400">User</span><p className="font-medium text-slate-800 dark:text-slate-200">{d.user?.name || '—'}</p></div>
        <div><span className="text-slate-400">Rollbackable</span><p className="font-medium text-slate-800 dark:text-slate-200">{d.isRollbackable ? 'Yes' : 'No'}</p></div>
      </div>

      {/* Config */}
      {d.config && Object.keys(d.config).length > 0 && (
        <div className="card p-5">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Configuration</h3>
          <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(d.config, null, 2)}</pre>
        </div>
      )}

      {/* Logs */}
      {d.logsRef && (
        <div className="card p-5">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Logs</h3>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{d.logsRef}</pre>
        </div>
      )}

      {/* Error */}
      {d.errorMessage && (
        <div className="card border-l-4 border-l-red-500 p-5">
          <h3 className="mb-1 font-semibold text-red-700 dark:text-red-300">Error</h3>
          <p className="text-sm text-slate-700 dark:text-slate-300">{d.errorMessage}</p>
        </div>
      )}

      {/* Timeline */}
      {d.timeline && d.timeline.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Status Timeline</h3>
          <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-2 space-y-4">
            {d.timeline.map((e, i) => (
              <li key={i} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-brand-500 dark:border-slate-900" />
                <time className="text-xs text-slate-400">{fmt(e.at)}</time>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{e.description || e.action}</p>
                {e.actor && <p className="text-xs text-slate-400">{e.actor}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
