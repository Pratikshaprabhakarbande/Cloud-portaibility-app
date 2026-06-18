/** Split-screen auth layout: branding panel + form panel (responsive). */
import Icon from '../../components/ui/Icon.jsx';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Icon name="cloud" className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">CloudPortability</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Deploy, secure, and optimize across AWS, Azure & GCP.
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            One unified, AI-assisted control plane for multi-cloud deployment automation,
            portability analysis, FinOps, and security.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-white/70">
          <span>● Multi-Cloud</span>
          <span>● AI-Powered</span>
          <span>● Secure by Design</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Icon name="cloud" className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">CloudPortability</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
