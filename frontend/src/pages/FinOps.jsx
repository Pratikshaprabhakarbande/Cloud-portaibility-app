import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import useNotification from '../hooks/useNotification.js';
import finopsService from '../services/finops.service.js';
import { getErrorMessage } from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Spinner, CardSkeleton } from '../components/ui/Loading.jsx';

const SCOPES = ['multi-cloud', 'aws', 'azure', 'gcp'];

export default function FinOps() {
  const { notify } = useNotification();
  const [scope, setScope] = useState('multi-cloud');
  const recs = useApi(() => finopsService.recommendations(scope), [scope]);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const data = await finopsService.analyze(scope === 'multi-cloud' ? 'aws' : scope);
      notify.success(`Savings: ~$${data.totalPotentialSavings}/mo`);
      recs.refetch();
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setAnalyzing(false); }
  };

  const data = recs.data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">FinOps Optimizer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cost optimization + resource utilization.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {SCOPES.map((s) => (
              <button key={s} type="button" onClick={() => setScope(s)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${scope === s ? 'bg-brand-600 text-white' : 'text-slate-500 dark:text-slate-300'}`}>{s === 'multi-cloud' ? 'Multi' : s.toUpperCase()}</button>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={analyze} disabled={analyzing}>
            {analyzing ? <Spinner size="sm" className="text-white" /> : 'Analyze'}
          </button>
        </div>
      </header>
      {recs.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{Array.from({length:3}).map((_,i)=><CardSkeleton key={i}/>)}</div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Monthly cost" value={`$${data.totals?.monthlyCost ?? 0}`} accent="brand" icon={<Icon name="dollar" />} />
            <StatCard label="Potential savings" value={`$${data.totalPotentialSavings ?? 0}/mo`} accent="green" icon={<Icon name="dollar" />} />
            <StatCard label="Utilization" value={`${data.utilization?.runningRatio ?? 0}%`} accent="amber" icon={<Icon name="chart" />} hint={`${data.utilization?.idleResources ?? 0} idle`} />
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Recommendations</h3>
            {(data.recommendations || []).length === 0 ? <p className="text-sm text-slate-400">No recommendations.</p> : (
              <ul className="space-y-3">
                {data.recommendations.map((r, i) => (
                  <li key={i} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{r.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
                    {r.estimatedMonthlySavings > 0 && <p className="mt-1 text-xs font-medium text-green-600">~${r.estimatedMonthlySavings}/mo</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
