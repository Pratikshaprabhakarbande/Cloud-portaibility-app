/**
 * NotificationArea — renders the toast stack (top-right), driven by
 * NotificationContext. Auto-dismiss handled by the provider.
 */
import Icon from '../ui/Icon.jsx';
import useNotification from '../../hooks/useNotification.js';

const STYLES = {
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200',
  info: 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
};

export default function NotificationArea() {
  const { toasts, remove } = useNotification();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex animate-slide-in items-start gap-3 rounded-xl border p-3 shadow-lg ${STYLES[t.type] || STYLES.info}`}
          role="alert"
        >
          <span className="mt-0.5 text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => remove(t.id)}
            className="ml-auto shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
