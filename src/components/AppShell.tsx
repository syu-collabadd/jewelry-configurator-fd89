import { type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white text-ink-900">
      <header className="border-b border-ink-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-lg font-semibold tracking-tight">
              TENLUMA
            </span>
            <span className="hidden text-xs text-ink-500 sm:inline">
              / Modular Jewelry
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavItem to="/">Design</NavItem>
            <NavItem to="/parts">Part Master</NavItem>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-24 border-t border-ink-100 bg-ink-50/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium text-ink-900">TENLUMA</div>
            <div className="text-xs">
              Configurable jewelry, made from approved parts.
            </div>
          </div>
          <div className="text-xs">
            Every design is built entirely from the TENLUMA Part Master — never
            AI-generated images.
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-3 py-1.5 transition ${
          isActive
            ? 'bg-ink-900 text-white'
            : 'text-ink-700 hover:bg-ink-50'
        }`
      }
      end={to === '/'}
    >
      {children}
    </NavLink>
  );
}

function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="4" fill="#F5A524" />
    </svg>
  );
}
