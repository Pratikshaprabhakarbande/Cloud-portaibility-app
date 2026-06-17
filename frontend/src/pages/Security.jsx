/**
 * Security Center — risk dashboard, security score, failed-login analytics,
 * and security events. Uses /api/security. The composite `overview` endpoint is
 * available to all roles; detailed failed-login sources are fetched only for
 * Cloud Engineer + Admin (avoids 403s for Viewers).
 */
import useApi from '../hooks/useApi.js';
import useAuth from '../hooks/useAuth.js';
import securityService from '../services/security.service.js';
import StatCard from '../components/ui/StatCard.jsx';
import HealthScoreCard from '../components/ui/HealthScoreCard.jsx';
import Badge from '../components/ui/Badge.jsx';
import Icon from '../components/ui/Icon.jsx';
import { CardSkeleton } from '../components/ui/Loading.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';

const LEVEL_BADGE = { low: 'operational', elevated: 'degraded', critical: 'outage' };

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function Security() {
  const { role } = useAuth();
  const canViewSensitive = ['Admin', 'Cloud Engineer'].includes(role);

  const overview = useApi(() => securityService.overview(), []);
  const failed = useApi(
    () => (canViewSensitive ? securityService.failedLogins(24) : Promise.resolve(null)),
    [canViewSensitive]
  );

  if (overview.error) return <ErrorState message={overview.error} onRetry={overview.refetch} />;

  const risk = overview.data?.risk;
  const events = overview.data?.recentEvents || [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Center</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Risk posture, authentication analytics, and security events.</p>
      </header>

      {/* Risk dashboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {overview.loading || !risk ? (
          <CardSkeleton />
        ) : (
          <HealthScoreCard score={risk.securityScore} title="Security Score" />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
          {overview.loading || !risk ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <StatCard label="Risk Score" value={`${risk.riskScore}/100`} accent="red" icon={<Icon name="shield" />} hint={<Badge status={LEVEL_BADGE[risk.level] || 'neutral'}>{risk.level}</Badge>} />
              <StatCard label="Failed logins (24h)" value={risk.inputs.failedLogins24h} accent="amber" icon={<Icon name="user" />} />
              <StatCard label="Open incidents" value={risk.inputs.openIncidents} accent="brand" icon={<Icon name="bell" />} />
              <StatCard label="Critical / High findings" value={`${risk.inputs.criticalFindings} / ${risk.inputs.highFindings}`} accent="red" icon={<Icon name="shield" />} />
            </>
          )}
        </div>
      </div>

      {/* Risk factor breakdown */}
      {risk && (
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Risk factors</h3>
          <div className="space-y-3">
            {Object.entries(risk.factors).map(([name, value]) => (
              <div key={name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="capitalize text-slate-500 dark:text-slate-400">{name.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{value}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(value * 2.5, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed login analytics (sensitive) */}
      {canViewSensitive && (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">Failed login sources (24h)</h3>
          </div>
          {failed.loading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">Loading…</div>
          ) : failed.error ? (
            <div className="p-5"><ErrorState message={failed.error} onRetry={failed.refetch} /></div>
          ) : (failed.data?.bySource || []).length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No failed logins in the last 24h.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">IP</th>
                    <th className="px-5 py-3 font-medium">Attempts</th>
                    <th className="px-5 py-3 font-medium">Last</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {failed.data.bySource.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{s.email || '—'}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{s.ip || '—'}</td>
                      <td className="px-5 py-3 font-medium text-red-600">{s.count}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{formatDate(s.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Security events */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent security events</h3>
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">No recent events.</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium capitalize text-slate-800 dark:text-slate-200">{e.action} {e.actorEmail ? `· ${e.actorEmail}` : ''}</p>
                  <p className="text-xs text-slate-400">{e.description || e.ip} · {formatDate(e.at)}</p>
                </div>
                <Badge status={e.success ? 'success' : 'failed'}>{e.success ? 'ok' : 'failed'}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
