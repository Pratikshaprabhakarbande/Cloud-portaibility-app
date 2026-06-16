/**
 * CloudProviderCard — per-provider status tile (AWS / Azure / GCP).
 */
import Badge from './Badge.jsx';

const PROVIDER_META = {
  aws: { label: 'AWS', color: 'text-aws', ring: 'ring-aws/30', bar: 'bg-aws' },
  azure: { label: 'Azure', color: 'text-azure', ring: 'ring-azure/30', bar: 'bg-azure' },
  gcp: { label: 'GCP', color: 'text-gcp', ring: 'ring-gcp/30', bar: 'bg-gcp' }
};

export default function CloudProviderCard({ provider }) {
  const meta = PROVIDER_META[provider.key] || PROVIDER_META.aws;

  return (
    <div className={`card p-5 ring-1 ${meta.ring}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 font-bold dark:bg-slate-800 ${meta.color}`}>
            {meta.label.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">{meta.label}</p>
            <p className="text-xs text-slate-400">{provider.region}</p>
          </div>
        </div>
        <Badge status={provider.status} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Health</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{provider.healthScore}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${provider.healthScore}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{provider.activeDeployments}</p>
          <p className="text-xs text-slate-400">Deployments</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{provider.runningContainers}</p>
          <p className="text-xs text-slate-400">Containers</p>
        </div>
      </div>
    </div>
  );
}
