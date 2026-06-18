import { useState } from 'react';
import useNotification from '../hooks/useNotification.js';
import migrationService from '../services/migration.service.js';
import { getErrorMessage } from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Spinner } from '../components/ui/Loading.jsx';

const PROVIDERS = ['aws', 'azure', 'gcp'];

export default function Migration() {
  const { notify } = useNotification();
  const [source, setSource] = useState('aws');
  const [target, setTarget] = useState('azure');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [comparison, setComparison] = useState(null);

  const compare = async () => {
    if (source === target) { notify.error('Source and target must differ'); return; }
    setLoading(true);
    try {
      const data = await migrationService.compare(source, target);
      setComparison(data);
      setPlan(null);
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    if (source === target) { notify.error('Source and target must differ'); return; }
    setLoading(true);
    try {
      const data = await migrationService.plan({ sourceProvider: source, targetProvider: target, workloadName: 'workload' });
      setPlan(data);
      notify.success('Migration plan generated');
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Migration Advisor</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Cross-cloud comparison, planning, risk & downtime estimation.</p>
      </header>
      <div className="card p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Source</label>
          <select className="input max-w-[120px]" value={source} onChange={(e) => setSource(e.target.value)}>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
        <span className="text-slate-400 text-lg pb-2">→</span>
        <div>
          <label className="label">Target</label>
          <select className="input max-w-[120px]" value={target} onChange={(e) => setTarget(e.target.value)}>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
        <button type="button" className="btn-secondary" onClick={compare} disabled={loading}>Compare</button>
        <button type="button" className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? <Spinner size="sm" className="text-white" /> : 'Generate Plan'}
        </button>
      </div>
      {comparison && !plan && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Service Mapping ({comparison.sourceName} → {comparison.targetName})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-500 dark:text-slate-400"><tr><th className="px-3 py-2">Category</th><th className="px-3 py-2">{comparison.sourceName}</th><th className="px-3 py-2">{comparison.targetName}</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.serviceMappings.map((m, i) => (
                  <tr key={i}><td className="px-3 py-2 capitalize">{m.category}</td><td className="px-3 py-2">{m.source}</td><td className="px-3 py-2">{m.target}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {plan && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatCard label="Risk level" value={plan.riskLevel} accent="red" icon={<Icon name="shield" />} />
            <StatCard label="Downtime est." value={`${plan.downtimeEstimateMinutes} min`} accent="amber" icon={<Icon name="chart" />} />
            <StatCard label="One-time cost" value={`$${plan.costEstimate?.oneTime ?? 0}`} accent="brand" icon={<Icon name="dollar" />} />
            <StatCard label="Monthly after" value={`$${plan.costEstimate?.monthlyAfter ?? 0}`} accent="green" icon={<Icon name="dollar" />} />
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Migration Steps</h3>
            <ol className="space-y-3">
              {plan.plan.map((step) => (
                <li key={step.order} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{step.order}. {step.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{step.description} · ~{step.estimatedHours}h</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Risk assessment</h3>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {plan.riskAssessment.map((r, i) => <li key={i} className="flex gap-2"><span className="text-red-500">•</span>{r}</li>)}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
