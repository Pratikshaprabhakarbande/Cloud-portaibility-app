/**
 * Multi-Cloud Dashboard
 * Provider status cards, KPI stats, health score, cost, charts, and recent
 * deployments. Data comes from dashboardService (demo data → live API later).
 */
import useApi from '../hooks/useApi.js';
import { useState } from 'react';
import dashboardService from '../services/dashboard.service.js';
import StatCard from '../components/ui/StatCard.jsx';
import CloudProviderCard from '../components/ui/CloudProviderCard.jsx';
import HealthScoreCard from '../components/ui/HealthScoreCard.jsx';
import CostCard from '../components/ui/CostCard.jsx';
import DeploymentTable from '../components/ui/DeploymentTable.jsx';
import Icon from '../components/ui/Icon.jsx';
import { CardSkeleton, PageLoader } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import {
  DeploymentTrendsChart,
  CloudUsageChart,
  ResourceUtilizationChart,
  CostTrendsChart
} from '../components/charts/index.js';

const SCOPES = [
  { key: 'multi-cloud', label: 'Multi-Cloud' },
  { key: 'aws', label: 'AWS' },
  { key: 'azure', label: 'Azure' },
  { key: 'gcp', label: 'GCP' }
];

export default function Dashboard() {
  const [scope, setScope] = useState('multi-cloud');
  const overview = useApi(() => dashboardService.getOverview(scope), [scope]);
  const charts = useApi(() => dashboardService.getCharts(scope), [scope]);

  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.refetch} />;

  const data = overview.data;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Multi-Cloud Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Unified view across AWS, Azure, and GCP.
          </p>
        </div>
        {/* Provider switcher */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setScope(s.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                scope === s.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI stats */}
      {overview.loading || !summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Deployments" value={summary.activeDeployments} accent="brand" icon={<Icon name="deployments" />} hint="across all clouds" />
          <StatCard label="Running Containers" value={summary.runningContainers} accent="green" icon={<Icon name="container" />} hint="healthy" />
          <StatCard label="Security Score" value={`${summary.securityScore}/100`} accent="amber" icon={<Icon name="shield" />} hint={`${summary.openIncidents} open incident(s)`} />
          <StatCard label="Monthly Cost" value={`$${summary.monthlyCost}`} accent="red" deltaPct={summary.costChangePct} hint="vs last month" />
        </div>
      )}

      {/* Provider status + health + cost */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
          {overview.loading || !data
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : data.providers.map((p) => <CloudProviderCard key={p.key} provider={p} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {summary && <HealthScoreCard score={summary.cloudHealthScore} />}
          {summary && charts.data && (
            <CostCard monthlyCost={summary.monthlyCost} changePct={summary.costChangePct} split={charts.data.cloudUsage} />
          )}
        </div>
      </div>

      {/* Charts */}
      {charts.loading ? (
        <PageLoader label="Loading charts..." />
      ) : charts.error ? (
        <ErrorState message={charts.error} onRetry={charts.refetch} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DeploymentTrendsChart data={charts.data.deploymentTrends} />
          <CloudUsageChart data={charts.data.cloudUsage} />
          <ResourceUtilizationChart data={charts.data.resourceUtilization} />
          <CostTrendsChart data={charts.data.costTrends} />
        </div>
      )}

      {/* Recent deployments */}
      {data && <DeploymentTable deployments={data.recentDeployments} title="Deployment History" />}
    </div>
  );
}
