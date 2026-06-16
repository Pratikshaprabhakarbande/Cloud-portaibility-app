/**
 * StatCard — a KPI tile with icon, value, label, and optional trend delta.
 */
export default function StatCard({ label, value, icon, deltaPct, hint, accent = 'brand' }) {
  const accentBg = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
  }[accent] || 'bg-brand-50 text-brand-600';

  const positive = typeof deltaPct === 'number' && deltaPct >= 0;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
        {icon && <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentBg}`}>{icon}</div>}
      </div>
      {(typeof deltaPct === 'number' || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {typeof deltaPct === 'number' && (
            <span className={positive ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
              {positive ? '▲' : '▼'} {Math.abs(deltaPct)}%
            </span>
          )}
          {hint && <span className="text-slate-400">{hint}</span>}
        </div>
      )}
    </div>
  );
}
