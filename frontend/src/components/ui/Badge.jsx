/** Status badge with semantic colors. */
const STYLES = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  rolled_back: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  destroyed: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  operational: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  outage: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
};

export default function Badge({ status = 'neutral', children, className = '' }) {
  const style = STYLES[status] || STYLES.neutral;
  const label = children ?? String(status).replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}>
      {label}
    </span>
  );
}
