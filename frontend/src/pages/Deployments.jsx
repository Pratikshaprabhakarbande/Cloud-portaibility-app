/**
 * Deployments — full deployment history with search, filters, stats, and trends.
 * Connected to: GET /api/dashboard/deployments, deployments/stats, deployments/trends
 */
import { useState } from 'react';
import useApi from '../hooks/useApi.js';
import dashboardService from '../services/dashboard.service.js';
import StatCard from '../components/ui/StatCard.jsx';
import DeploymentTable from '../components/ui/DeploymentTable.jsx';
import Icon from '../components/ui/Icon.jsx';
import { CardSkeleton } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { DeploymentTrendsChart } from '../components/charts/index.js';

const PROVIDERS = ['', 'aws', 'azure', 'gcp'];
const STATUSES = ['', 'pending', 'in_progress', 'success', 'failed', 'rolled_back', 'destroyed'];
const TYPES = ['', 'terraform', 'docker', 'kubernetes', 'manual'];

export default function Deployments() {
  const [filters, setFilters] = useState({ provider: '', status: '', type: '', search: '', page: 1 });

  const params = Object.fromEntries(Object.entries({ ...filters, limit: 15 }).filter(([, v]) => v));
  const history = useApi(() => dashboardService.listDeployments(params), [JSON.stringify(params)]);
  const stats = useApi(() => dashboardService.getDeploymentStats(), []);
  const trends = useApi(() => dashboardService.getDeploymentTrends({ days: 7 }), []);

  const update = (key, val) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  const data = history.data;
  const s = stats.data;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deployments</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Full deployment history with search, filters, and analytics.</p>
      </header>

      {/* Stats */}
      {stats.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : s && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Total" value={s.total} accent="brand" icon={<Icon name="deployments" />} />
          <StatCard label="Active" value={s.active} accent="green" icon={<Icon name="rocket" />} />
          <StatCard label="Success rate" value={s.successRate != null ? `${s.successRate}%` : '—'} accent="green" icon={<Icon name="chart" />} />
          <StatCard label="Failed" value={s.byStatus?.failed || 0} accent="red" icon={<Icon name="close" />} />
        </div>
      )}

      {/* Trends */}
      {trends.data && <DeploymentTrendsChart data={trends.data} />}

      {/* Filters */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="label">Search</label>
          <input className="input w-48" placeholder="Name..." value={filters.search} onChange={(e) => update('search', e.target.value)} />
        </div>
        <div>
          <label className="label">Provider</label>
          <select className="input w-28" value={filters.provider} onChange={(e) => update('provider', e.target.value)}>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p || 'All'}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input w-32" value={filters.status} onChange={(e) => update('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Type</label>
          <select className="input w-32" value={filters.type} onChange={(e) => update('type', e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t || 'All'}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {history.error ? (
        <ErrorState message={history.error} onRetry={history.refetch} />
      ) : (
        <DeploymentTable deployments={data?.results || []} title={`Results (${data?.totalResults ?? '...'})`} />
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" className="btn-secondary" disabled={!data.hasPrevPage} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Prev</button>
          <span className="text-sm text-slate-500">Page {data.page} / {data.totalPages}</span>
          <button type="button" className="btn-secondary" disabled={!data.hasNextPage} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
        </div>
      )}
    </div>
  );
}
