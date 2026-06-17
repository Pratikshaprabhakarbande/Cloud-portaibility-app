/**
 * Terraform Center — IaC status, actions, infrastructure overview, history.
 * Uses /api/terraform (safe simulation by default). Apply/Destroy are gated to
 * Cloud Engineer + Admin (matching the backend RBAC).
 */
import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import useAuth from '../hooks/useAuth.js';
import useNotification from '../hooks/useNotification.js';
import terraformService from '../services/terraform.service.js';
import { getErrorMessage } from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Spinner } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

const PROVIDERS = [
  { key: 'aws', label: 'AWS' },
  { key: 'azure', label: 'Azure' },
  { key: 'gcp', label: 'GCP' }
];

const ACTIONS = [
  { key: 'init', label: 'Init', mutate: false },
  { key: 'validate', label: 'Validate', mutate: false },
  { key: 'plan', label: 'Plan', mutate: false },
  { key: 'apply', label: 'Apply', mutate: true },
  { key: 'destroy', label: 'Destroy', mutate: true, danger: true }
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function Terraform() {
  const { role } = useAuth();
  const { notify } = useNotification();
  const [provider, setProvider] = useState('aws');
  const [running, setRunning] = useState(null);
  const [output, setOutput] = useState('');
  const history = useApi(() => terraformService.history({ limit: 10 }), []);

  const canMutate = ['Admin', 'Cloud Engineer'].includes(role);
  const runs = history.data?.results || [];
  const lastStatus = runs[0]?.status || '—';
  const providersUsed = new Set(runs.map((r) => r.provider)).size;

  const run = async (action) => {
    if (action === 'destroy' && !window.confirm('Run terraform destroy? This is a mutating action.')) return;
    setRunning(action);
    try {
      const res = await terraformService.run(action, provider);
      setOutput(res.logs || '');
      notify.success(`terraform ${action} (${res.mode}) → ${res.status}`);
      history.refetch();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Terraform Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Infrastructure-as-Code automation — runs in safe simulation mode by default.
        </p>
      </header>

      {/* Infrastructure overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Terraform runs" value={history.data?.totalResults ?? runs.length} accent="brand" icon={<Icon name="rocket" />} />
        <StatCard label="Last status" value={lastStatus} accent="green" icon={<Icon name="deployments" />} />
        <StatCard label="Providers used" value={providersUsed} accent="amber" icon={<Icon name="cloud" />} />
      </div>

      {/* Actions */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white">Run Terraform</h3>
        <p className="mb-4 text-xs text-slate-400">Select a provider, then run an action.</p>

        <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {PROVIDERS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setProvider(p.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                provider === p.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => {
            const disabled = (a.mutate && !canMutate) || running !== null;
            return (
              <button
                key={a.key}
                type="button"
                disabled={disabled}
                onClick={() => run(a.key)}
                className={a.danger ? 'btn border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300' : 'btn-secondary'}
                title={a.mutate && !canMutate ? 'Requires Cloud Engineer role' : ''}
              >
                {running === a.key ? <Spinner size="sm" /> : a.label}
              </button>
            );
          })}
        </div>
        {!canMutate && (
          <p className="mt-3 text-xs text-slate-400">Apply and Destroy require the Cloud Engineer or Admin role.</p>
        )}
      </div>

      {/* Output */}
      {output && (
        <div className="card p-5">
          <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">Output</h3>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">{output}</pre>
        </div>
      )}

      {/* History */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Deployment History</h3>
          <button type="button" className="text-xs text-brand-600 hover:underline" onClick={history.refetch}>Refresh</button>
        </div>
        {history.loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Loading…</div>
        ) : history.error ? (
          <div className="p-5"><ErrorState message={history.error} onRetry={history.refetch} /></div>
        ) : runs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No Terraform runs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">By</th>
                  <th className="px-5 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium uppercase text-slate-700 dark:text-slate-200">{r.provider}</td>
                    <td className="px-5 py-3 capitalize text-slate-600 dark:text-slate-300">{r.action}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{r.mode}</td>
                    <td className="px-5 py-3"><Badge status={r.status} /></td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{r.user}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(r.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
