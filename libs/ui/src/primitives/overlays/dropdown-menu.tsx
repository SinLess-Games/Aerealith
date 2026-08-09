import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/cn';

type FocusTarget = 'first' | 'last';
type MenuContextValue = {
  contentId: string;
  open: boolean;
  openMenu: (target?: FocusTarget) => void;
  closeMenu: (restoreFocus?: boolean) => void;
  triggerId: string;
  focusTarget: FocusTarget;
};

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

function useMenu() {
  const menu = useContext(MenuContext);
  if (!menu) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return menu;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>('first');
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;

  const openMenu = (target: FocusTarget = 'first') => {
    setFocusTarget(target);
    setOpen(true);
  };
  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      document.getElementById(triggerId)?.focus();
    }
  };

  return (
    <MenuContext.Provider
      value={{
        contentId: `${baseId}-menu`,
        open,
        openMenu,
        closeMenu,
        triggerId,
        focusTarget,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  onClick,
  onKeyDown,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  const menu = useMenu();
  return (
    <button
      {...props}
      aria-controls={menu.contentId}
      aria-expanded={menu.open}
      aria-haspopup="menu"
      data-slot="dropdown-menu-trigger"
      id={menu.triggerId}
      onClick={(event) => {
        if (menu.open) menu.closeMenu();
        else menu.openMenu();
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          menu.openMenu(event.key === 'ArrowUp' ? 'last' : 'first');
        }
        if (event.key === 'Escape' && menu.open) {
          event.preventDefault();
          menu.closeMenu(true);
        }
        onKeyDown?.(event);
      }}
      type="button"
    />
  );
}

export function DropdownMenuContent({
  className,
  onKeyDown,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const menu = useMenu();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu.open) return;
    const items = Array.from(
      contentRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? [],
    );
    const target = menu.focusTarget === 'last' ? items.at(-1) : items[0];
    target?.focus();
  }, [menu.focusTarget, menu.open]);

  if (!menu.open) return null;

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ),
    );
    const currentIndex = items.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    let nextIndex: number | undefined;
    if (event.key === 'ArrowDown')
      nextIndex = (currentIndex + 1 + items.length) % items.length;
    if (event.key === 'ArrowUp')
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (event.key === 'Escape') {
      event.preventDefault();
      menu.closeMenu(true);
      return;
    }
    if (nextIndex === undefined || items.length === 0) return;
    event.preventDefault();
    items[nextIndex]?.focus();
  };

  return (
    <div
      {...props}
      aria-labelledby={menu.triggerId}
      className={cn(
        'z-50 min-w-40 rounded-md border border-[var(--ae-border)] bg-[var(--ae-surface-overlay)] p-1 text-[var(--ae-foreground)] shadow-[var(--ae-shadow-lg)]',
        className,
      )}
      data-slot="dropdown-menu-content"
      id={menu.contentId}
      onKeyDown={(event) => {
        moveFocus(event);
        onKeyDown?.(event);
      }}
      ref={contentRef}
      role="menu"
    />
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  const menu = useMenu();
  return (
    <button
      {...props}
      className={cn(
        'flex min-h-10 w-full rounded px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-[var(--ae-control-hover)] focus-visible:bg-[var(--ae-control-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)] disabled:opacity-50',
        className,
      )}
      data-slot="dropdown-menu-item"
      onClick={(event) => {
        menu.closeMenu(true);
        onClick?.(event);
      }}
      role="menuitem"
      tabIndex={-1}
      type="button"
    />
  );
}

export function DropdownMenuLabel(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot="dropdown-menu-label" />;
}
export function DropdownMenuSeparator(props: ComponentPropsWithoutRef<'hr'>) {
  return <hr {...props} data-slot="dropdown-menu-separator" />;
}
export function DropdownMenuGroup({ children }: { children: ReactNode }) {
  return <div role="group">{children}</div>;
}
export const DropdownMenuPortal = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
export const DropdownMenuShortcut = (
  props: ComponentPropsWithoutRef<'span'>,
) => <span {...props} data-slot="dropdown-menu-shortcut" />;
export const DropdownMenuSub = DropdownMenu;
export const DropdownMenuSubTrigger = DropdownMenuTrigger;
export const DropdownMenuSubContent = DropdownMenuContent;
export const DropdownMenuCheckboxItem = DropdownMenuItem;
export const DropdownMenuRadioItem = DropdownMenuItem;
export const DropdownMenuRadioGroup = DropdownMenuGroup;
