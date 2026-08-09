import { Outlet, useLocation } from 'react-router';

import { PublicFooter } from './public-footer';
import { PublicHeader } from './public-header';

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col gap-8">
      <a
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-[var(--ae-background)] px-4 py-2 text-sm font-semibold text-[var(--ae-foreground)] shadow-xl transition-transform focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-focus-ring)]"
        href={`${location.pathname}${location.search}#main-content`}
      >
        Skip to main content
      </a>
      <PublicHeader />

      <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
        <Outlet />
      </main>

      <PublicFooter />
    </div>
  );
}

export default PublicLayout;
