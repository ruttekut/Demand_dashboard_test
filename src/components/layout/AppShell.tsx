import { Menu, MessageSquare } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTelemetry } from '../../telemetry/TelemetryProvider';

export const AppShell = ({ children }: PropsWithChildren) => {
  const [navOpen, setNavOpen] = useState(false);
  const { events } = useTelemetry();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#main" className="absolute left-4 top-4 -translate-y-20 rounded bg-white px-4 py-2 text-sm shadow focus:translate-y-0">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen((prev) => !prev)}
              className="rounded border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="text-lg font-semibold text-slate-900">
              Trustoo Demand Hub
            </Link>
          </div>
          <nav
            className={`flex-1 justify-center gap-6 text-sm font-medium text-slate-600 md:flex ${
              navOpen ? 'flex' : 'hidden'
            }`}
            aria-label="Primary"
          >
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded px-3 py-2 hover:text-slate-900 focus:outline-none focus:ring ${
                  isActive ? 'bg-brand-50 text-brand-700' : ''
                }`
              }
              onClick={() => setNavOpen(false)}
            >
              Dashboard
            </NavLink>
          </nav>
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex" aria-live="polite">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>{events.length} telemetry events</span>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 focus:outline-none">
        {children}
      </main>
    </div>
  );
};
