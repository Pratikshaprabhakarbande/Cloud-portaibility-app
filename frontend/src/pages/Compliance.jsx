import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import useNotification from '../hooks/useNotification.js';
import complianceService from '../services/compliance.service.js';
import { getErrorMessage } from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import HealthScoreCard from '../components/ui/HealthScoreCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Spinner, CardSkeleton } from '../components/ui/Loading.jsx';

const PROVIDERS = ['aws', 'azure', 'gcp'];

export default function Compliance() {
  const { notify } = useNotification();
  const [provider, setProvider] = useState('aws');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const reports = useApi(() => complianceService.reports({ limit: 5 }), []);

  const scan = async () => {
    setScanning(true);
    try {
      const data = await complianceService.scan({ provider, framework: 'CIS' });
      setResult(data);
      notify.success(`Compliance score: ${data.complianceScore}/100`);
      reports.refetch();
    } catch (err) { notify.error(getErrorMessage(err)); }
    finally { setScanning(false); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Checker</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">CIS benchmark evaluation per cloud provider.</p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        {PROVIDERS.map((p) => (
          <button key={p} type="button" onClick={() => setProvider(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase ${provider === p ? 'bg-brand-600 text-white' : 'border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300'}`}>{p}</button>
        ))}
        <button type="button" className="btn-primary" onClick={scan} disabled={scanning}>
          {scanning ? <Spinner size="sm" className="text-white" /> : 'Run scan'}
        </button>
      </div>
      {result && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <HealthScoreCard score={result.complianceScore} title="Compliance Score" />
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatCard label="Total controls" value={result.summary.total} accent="brand" icon={<Icon name="compliance" />} />
            <StatCard label="Passed" value={result.summary.passed} accent="green" icon={<Icon name="shield" />} />
            <StatCard label="Failed" value={result.summary.failed} accent="red" icon={<Icon name="shield" />} />
            <StatCard label="Warnings" value={result.summary.warnings} accent="amber" icon={<Icon name="bell" />} />
          </div>
        </div>
      )}
      {result && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><h3 className="font-semibold text-slate-900 dark:text-white">Controls</h3></div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.controls.map((c, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div><p className="font-medium text-slate-800 dark:text-slate-200">{c.controlId} — {c.title}</p><p className="text-xs text-slate-400">{c.remediation}</p></div>
                <Badge status={c.status === 'pass' ? 'success' : c.status === 'fail' ? 'failed' : 'pending'}>{c.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
      {reports.loading ? <CardSkeleton /> : (reports.data?.results || []).length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Recent reports</h3>
          <ul className="space-y-2 text-sm">
            {reports.data.results.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <span className="uppercase text-slate-600 dark:text-slate-300">{r.provider} · {r.framework}</span>
                <span className="font-medium">{r.complianceScore}/100</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
