/**
 * CostCard — monthly spend with trend and a quick provider split.
 */
export default function CostCard({ monthlyCost = 0, changePct = 0, split = [] }) {
  const positive = changePct >= 0;
  const fmt = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Monthly Cost</p>
        <span className={`text-xs font-medium ${positive ? 'text-red-600' : 'text-green-600'}`}>
          {positive ? '▲' : '▼'} {Math.abs(changePct)}%
        </span>
      </div>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{fmt(monthlyCost)}</p>

      {split.length > 0 && (
        <div className="mt-4 space-y-2">
          {split.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{s.name}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{s.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
