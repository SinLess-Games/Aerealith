import { Dialog, DialogContent, DialogOverlay } from '@aerealith-ai/ui';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

export function AuthModal({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const close = () => navigate('/');

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogOverlay className="z-[70] bg-[color-mix(in_srgb,var(--ae-background)_78%,transparent)] backdrop-blur-sm motion-reduce:backdrop-blur-none" />
      <DialogContent
        aria-label={ariaLabel}
        className={[
          'z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto',
          'w-[min(34rem,calc(100%-2rem))] rounded-2xl border',
          'border-[color-mix(in_srgb,var(--ae-accent)_24%,var(--ae-border))]',
          'bg-[color-mix(in_srgb,var(--ae-background)_94%,transparent)] p-0',
          'shadow-[var(--ae-shadow-lg)] backdrop-blur-2xl motion-reduce:backdrop-blur-none',
        ].join(' ')}
      >
        <button
          type="button"
          aria-label="Close authentication"
          onClick={close}
          className={[
            'absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center',
            'rounded-full border border-[var(--ae-border)]',
            'bg-[color-mix(in_srgb,var(--ae-surface)_72%,transparent)]',
            'text-xl text-[var(--ae-foreground-muted)] transition',
            'hover:border-[var(--ae-accent)] hover:text-[var(--ae-foreground)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--ae-accent)]',
          ].join(' ')}
        >
          <span aria-hidden="true">×</span>
        </button>
        {children}
      </DialogContent>
    </Dialog>
  );
}
