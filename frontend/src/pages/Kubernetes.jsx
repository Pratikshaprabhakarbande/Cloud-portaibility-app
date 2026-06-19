/**
 * Kubernetes — managed-K8s overview (EKS/AKS/GKE) using data already available
 * from the cloud adapters (kubernetes-type resources) and the migration service
 * equivalence constants. Shows cluster status cards per provider and any K8s-
 * type resources from the dashboard.
 */
import useApi from '../hooks/useApi.js';
import dashboardService from '../services/dashboard.service.js';
import StatCard from '../components/ui/StatCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { CardSkeleton } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

const CLUSTERS = [
  { key: 'aws', service: 'Amazon EKS', region: 'us-east-1', icon: 'A' },
  { key: 'azure', service: 'Azure AKS', region: 'eastus', icon: 'A' },
  { key: 'gcp', service: 'Google GKE', region: 'us-central1', icon: 'G' }
];

const PROVIDER_COLORS = { aws: 'text-aws', azure: 'text-azure', gcp: 'text-gcp' };

export default function Kubernetes() {
  const overview = useApi(() => dashboardService.getOverview('multi-cloud'), []);
  const data = overview.data;

  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.refetch} />;

  // K8s containers come from provider cards (runningContainers).
  const providerMap = {};
  (data?.providers || []).forEach((p) => { providerMap[p.key] = p; });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kubernetes Management</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Managed clusters across AWS (EKS), Azure (AKS), and GCP (GKE).</p>
      </header>

      {/* Cluster cards */}
      {overview.loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CLUSTERS.map((c) => {
            const prov = providerMap[c.key];
            const status = prov?.status || 'unknown';
            const containers = prov?.runningContainers ?? 0;
            return (
              <div key={c.key} className="card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-bold dark:bg-slate-800 ${PROVIDER_COLORS[c.key]}`}>{c.icon}</div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{c.service}</p>
                    <p className="text-xs text-slate-400">{c.region}</p>
                  </div>
                  <Badge status={status} className="ml-auto" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{containers}</p>
                    <p className="text-xs text-slate-400">Pods / Containers</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{prov?.healthScore ?? '—'}</p>
                    <p className="text-xs text-slate-400">Health</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total containers" value={data.summary.runningContainers} accent="green" icon={<Icon name="container" />} />
          <StatCard label="Active deployments (K8s)" value={data.summary.activeDeployments} accent="brand" icon={<Icon name="deployments" />} />
          <StatCard label="Cloud health" value={`${data.summary.cloudHealthScore}/100`} accent="brand" icon={<Icon name="chart" />} />
        </div>
      )}

      {/* Service equivalence */}
      <div className="card p-5">
        <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Service equivalence</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500 dark:text-slate-400">
              <tr><th className="px-3 py-2">Capability</th><th className="px-3 py-2">AWS</th><th className="px-3 py-2">Azure</th><th className="px-3 py-2">GCP</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr><td className="px-3 py-2">Managed K8s</td><td className="px-3 py-2">EKS</td><td className="px-3 py-2">AKS</td><td className="px-3 py-2">GKE</td></tr>
              <tr><td className="px-3 py-2">Container Registry</td><td className="px-3 py-2">ECR</td><td className="px-3 py-2">ACR</td><td className="px-3 py-2">Artifact Registry</td></tr>
              <tr><td className="px-3 py-2">Serverless Containers</td><td className="px-3 py-2">Fargate</td><td className="px-3 py-2">Container Apps</td><td className="px-3 py-2">Cloud Run</td></tr>
              <tr><td className="px-3 py-2">Service Mesh</td><td className="px-3 py-2">App Mesh</td><td className="px-3 py-2">Service Mesh (OSM)</td><td className="px-3 py-2">Anthos / Istio</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Cluster data is derived from the Cloud Adapter Layer. For real-time pod/deployment/service listing,
        connect a kubeconfig via the backend (planned extension).
      </p>
    </div>
  );
}
