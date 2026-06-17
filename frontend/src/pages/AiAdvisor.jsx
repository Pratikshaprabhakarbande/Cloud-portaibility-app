/**
 * AI Cloud Advisor — generates cost / security / infrastructure / multi-cloud
 * recommendations from live platform data (rule-based engine, LLM-ready).
 * Uses /api/ai. Generation requires DevOps Engineer or above (backend RBAC).
 */
import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import useNotification from '../hooks/useNotification.js';
import aiService from '../services/ai.service.js';
import { getErrorMessage } from '../services/api.js';
import Icon from '../components/ui/Icon.jsx';
import { Spinner } from '../components/ui/Loading.jsx';

const SCOPES = [
  { key: 'multi-cloud', label: 'Multi-Cloud' },
  { key: 'aws', label: 'AWS' },
  { key: 'azure', label: 'Azure' },
  { key: 'gcp', label: 'GCP' }
];

function Panel({ title, icon, accent, children }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Bullets({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400">No recommendations.</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 text-brand-500">•</span>
          <span>{typeof it === 'string' ? it : `${it.title}${it.detail ? ` — ${it.detail}` : ''}`}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AiAdvisor() {
  const { notify } = useNotification();
  const [scope, setScope] = useState('multi-cloud');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const history = useApi(() => aiService.recommendations({ limit: 5 }), []);

  const generate = async () => {
    setGenerating(true);
    try {
      const data = await aiService.generate({ provider: scope });
      setResult(data);
      notify.success('Recommendations generated');
      history.refetch();
    } catch (err) {
      notify.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Cloud Advisor</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Data-driven cost, security, and infrastructure recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setScope(s.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  scope === s.key ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={generate} disabled={generating}>
            {generating ? <Spinner size="sm" className="text-white" /> : 'Generate'}
          </button>
        </div>
      </header>

      {result ? (
        <>
          <div className="card border-l-4 border-l-brand-500 p-5">
            <p className="text-sm text-slate-600 dark:text-slate-300">{result.summary}</p>
            <p className="mt-2 text-xs text-slate-400">
              Engine: {result.engine?.engine} · Scope: {result.scope}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Cost Optimization" icon="dollar" accent="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300">
              {result.costOptimization && result.costOptimization.length > 0 ? (
                <ul className="space-y-3">
                  {result.costOptimization.map((c, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.detail}</p>
                      {c.estimatedMonthlySavings ? (
                        <p className="mt-1 text-xs font-medium text-green-600">~${c.estimatedMonthlySavings}/mo savings</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No cost recommendations.</p>
              )}
            </Panel>

            <Panel title="Security Recommendations" icon="shield" accent="bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
              <Bullets items={result.securityRecommendations} />
            </Panel>

            <Panel title="Infrastructure" icon="chart" accent="bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <Bullets items={[...(result.resourceOptimization || []), ...(result.infraHealthInsights || [])]} />
            </Panel>

            <Panel title="Multi-Cloud / Deployment" icon="cloud" accent="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <Bullets items={result.deployment} />
            </Panel>
          </div>
        </>
      ) : (
        <div className="card flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <Icon name="sparkles" className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose a scope and click <strong>Generate</strong> to get recommendations.
          </p>
        </div>
      )}

      {/* History */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent recommendations</h3>
        </div>
        {history.loading ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Loading…</div>
        ) : (history.data?.results || []).length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">No recommendations yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.data.results.map((r) => (
              <li key={r.id} className="px-5 py-3 text-sm">
                <p className="font-medium text-slate-800 dark:text-slate-200">{r.title}</p>
                <p className="text-xs text-slate-400">{r.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
