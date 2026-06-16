/** Wrapper card giving charts a consistent header + fixed height. */
export default function ChartCard({ title, subtitle, children, height = 280 }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}
