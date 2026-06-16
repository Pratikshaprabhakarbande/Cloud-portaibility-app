/** Loading components: Spinner, full-page loader, and skeleton blocks. */

export function Spinner({ size = 'md', className = '' }) {
  const dims = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size] || 'h-6 w-6';
  return (
    <svg
      className={`animate-spin text-brand-600 ${dims} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      role="status"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner size="lg" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export default Spinner;
