/**
 * Monitoring — displays key platform metrics fetched from the Prometheus-
 * compatible /metrics endpoint (parsed as text) and provides quick-links to
 * the external Grafana dashboards. No new backend API required.
 */
import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import api from '../services/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import Icon from '../components/ui/Icon.jsx';
import { PageLoader } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

const GRAFANA_BASE = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3001';
const DASHBOARDS = [
  { uid: 'cp-backend-overview', title: 'Service Health' },
  { uid: 'cp-infrastructure', title: 'Infrastructure' },
  { uid: 'cp-deployments', title: 'Deployments' },
  { uid: 'cp-security', title: 'Security' },
  { uid: 'cp-cost', title: 'Cost (FinOps)' },
  { uid: 'cp-multi-cloud', title: 'Multi-Cloud' }
];

function parseMetric(text, name) {
  const re = new RegExp(`^${name}(?:{[^}]*})?\\s+([\\d.]+)`, 'm');
  const m = text.match(re);
  return m ? parseFloat(m[1]) : null;
}

async function fetchMetrics() {
  // /metrics is outside /api, so we call the base URL directly.
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  const res = await fetch(`${baseUrl}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch metrics');
  const text = await res.text();
  return {
    httpRequests: parseMetric(text, 'http_requests_total'),
    httpErrors: parseMetric(text, 'http_request_errors_total'),
    healthScore: parseMetric(text, 'cloud_health_score{provider="overall"}'),
    activeDeployments: parseMetric(text, 'cloud_active_deployments'),
    containers: parseMetric(text, 'cloud_running_containers'),
    openIncidents: parseMetric(text, 'cloud_open_incidents'),
    monthlyCost: parseMetric(text, 'cloud_monthly_cost_usd{provider="total"}'),
    securityScore: parseMetric(text, 'cloud_security_score{provider="overall"}'),
    heapUsed: parseMetric(text, 'nodejs_heap_size_used_bytes'),
    eventLoopLag: parseMetric(text, 'nodejs_eventloop_lag_seconds')
  };
}

export default function Monitoring() {
  const metrics = useApi(fetchMetrics, []);
  const [tab, setTab] = useState('metrics');
  const m = metrics.data;

  if (metrics.error) return <ErrorState message={metrics.error} onRetry={metrics.refetch} />;
  if (metrics.loading) return <PageLoader label="Fetching metrics..." />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Monitoring Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live platform metrics and Grafana dashboards.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {['metrics', 'dashboards'].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-brand-600 text-white' : 'text-slate-500 dark:text-slate-300'}`}>{t}</button>
          ))}
        </div>
      </header>

      {tab === 'metrics' && m && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Health Score" value={m.healthScore != null ? `${Math.round(m.healthScore)}` : '—'} accent="green" icon={<Icon name="chart" />} />
            <StatCard label="Security Score" value={m.securityScore != null ? `${Math.round(m.securityScore)}` : '—'} accent="brand" icon={<Icon name="shield" />} />
            <StatCard label="Active Deployments" value={m.activeDeployments ?? '—'} accent="brand" icon={<Icon name="deployments" />} />
            <StatCard label="Running Containers" value={m.containers ?? '—'} accent="green" icon={<Icon name="container" />} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Monthly Cost" value={m.monthlyCost != null ? `$${Math.round(m.monthlyCost)}` : '—'} accent="amber" icon={<Icon name="dollar" />} />
            <StatCard label="Open Incidents" value={m.openIncidents ?? '—'} accent="red" icon={<Icon name="bell" />} />
            <StatCard label="Heap Used (MB)" value={m.heapUsed != null ? `${Math.round(m.heapUsed / 1048576)}` : '—'} accent="brand" icon={<Icon name="chart" />} />
            <StatCard label="Event Loop Lag" value={m.eventLoopLag != null ? `${(m.eventLoopLag * 1000).toFixed(1)}ms` : '—'} accent="green" icon={<Icon name="chart" />} />
          </div>
          <div className="card p-5">
            <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">HTTP Traffic</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-400">Total requests:</span> <span className="font-medium text-slate-800 dark:text-slate-200">{m.httpRequests != null ? Math.round(m.httpRequests) : '—'}</span></div>
              <div><span className="text-slate-400">5xx errors:</span> <span className="font-medium text-red-600">{m.httpErrors != null ? Math.round(m.httpErrors) : '0'}</span></div>
            </div>
          </div>
          <p className="text-xs text-slate-400">Data from <code>GET /metrics</code> (Prometheus exposition). Auto-refreshes on page load. For historical charts, use the Dashboards tab.</p>
        </>
      )}

      {tab === 'dashboards' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DASHBOARDS.map((d) => (
            <a
              key={d.uid}
              href={`${GRAFANA_BASE}/d/${d.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-3 p-5 transition hover:ring-2 hover:ring-brand-500"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                <Icon name="chart" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{d.title}</p>
                <p className="text-xs text-slate-400">Open in Grafana →</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
