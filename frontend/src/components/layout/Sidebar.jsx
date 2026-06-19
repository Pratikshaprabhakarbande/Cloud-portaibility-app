/**
 * Sidebar — role-based navigation. Fixed on desktop, slide-over on mobile.
 */
import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import useAuth from '../../hooks/useAuth.js';
import { navForRole } from '../../config/navigation.js';

export default function Sidebar({ open, onClose }) {
  const { role } = useAuth();
  const sections = navForRole(role);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Icon name="cloud" className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900 dark:text-white">CloudPortability</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Multi-Cloud Platform</p>
          </div>
        </div>

        <nav className="h-[calc(100%-4rem)] overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
