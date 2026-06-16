/**
 * HealthScoreCard — circular gauge for the aggregate cloud health score.
 */
export default function HealthScoreCard({ score = 0, title = 'Cloud Health Score' }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 85 ? '#16a34a' : score >= 70 ? '#f59e0b' : '#dc2626';
  const status = score >= 85 ? 'Healthy' : score >= 70 ? 'Degraded' : 'At Risk';

  return (
    <div className="card flex flex-col items-center justify-center p-5">
      <p className="mb-3 self-start text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-slate-800" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium" style={{ color }}>
        {status}
      </p>
    </div>
  );
}
