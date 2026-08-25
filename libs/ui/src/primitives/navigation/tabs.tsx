import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from 'react';

import { cn } from '../../lib/cn';

type TabsContextValue = {
  baseId: string;
  value: string;
  setValue: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const value = useContext(TabsContext);
  if (!value) throw new Error('Tabs components must be used within Tabs');
  return value;
}

function idFor(baseId: string, value: string, kind: 'tab' | 'panel') {
  return `${baseId}-${kind}-${encodeURIComponent(value)}`;
}

export interface TabsProps extends ComponentPropsWithoutRef<'div'> {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  className,
  ...props
}: Readonly<TabsProps>) {
  const [internal, setInternal] = useState(defaultValue);
  const baseId = useId();
  const current = value ?? internal;
  const setValue = useCallback(
    (next: string) => {
      if (value === undefined) setInternal(next);
      onValueChange?.(next);
    },
    [onValueChange, value],
  );
  const contextValue = useMemo(
    () => ({ baseId, value: current, setValue, orientation }),
    [baseId, current, orientation, setValue],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        {...props}
        className={cn(
          'flex gap-2',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
          className,
        )}
        data-orientation={orientation}
        data-slot="tabs"
      />
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const { orientation } = useTabs();
  return (
    <div
      {...props}
      aria-orientation={orientation}
      className={cn(
        'inline-flex gap-1 rounded-md border border-[var(--ae-border-subtle)] bg-[var(--ae-surface-muted)] p-1',
        orientation === 'vertical' && 'flex-col',
        className,
      )}
      data-slot="tabs-list"
      role="tablist"
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ComponentPropsWithoutRef<'button'> {
  value: string;
}

export function TabsTrigger({
  value,
  className,
  onClick,
  onKeyDown,
  ...props
}: TabsTriggerProps) {
  const tabs = useTabs();
  const selected = tabs.value === value;
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>) => {
    const list = event.currentTarget.closest<HTMLElement>('[role="tablist"]');
    const triggers = Array.from(
      list?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ) ?? [],
    );
    const currentIndex = triggers.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    const previousKey =
      tabs.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey =
      tabs.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    let nextIndex: number | undefined;
    if (event.key === previousKey)
      nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    if (event.key === nextKey) nextIndex = (currentIndex + 1) % triggers.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = triggers.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    const next = triggers[nextIndex];
    next.focus();
    tabs.setValue(next.dataset.value ?? value);
  };

  return (
    <button
      {...props}
      aria-controls={idFor(tabs.baseId, value, 'panel')}
      aria-selected={selected}
      className={cn(
        'rounded px-3 py-1.5 text-sm text-[var(--ae-foreground-muted)] outline-none transition-colors hover:text-[var(--ae-foreground)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]',
        selected &&
          'bg-[var(--ae-surface-raised)] text-[var(--ae-foreground)] shadow-[var(--ae-shadow-sm)]',
        className,
      )}
      data-slot="tabs-trigger"
      data-value={value}
      id={idFor(tabs.baseId, value, 'tab')}
      onClick={(event) => {
        tabs.setValue(value);
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        moveFocus(event);
        onKeyDown?.(event);
      }}
      role="tab"
      tabIndex={selected ? 0 : -1}
      type="button"
    />
  );
}

export interface TabsContentProps extends ComponentPropsWithoutRef<'div'> {
  value: string;
}

export function TabsContent({ value, ...props }: TabsContentProps) {
  const tabs = useTabs();
  if (tabs.value !== value) return null;
  return (
    <div
      {...props}
      aria-labelledby={idFor(tabs.baseId, value, 'tab')}
      data-slot="tabs-content"
      id={idFor(tabs.baseId, value, 'panel')}
      role="tabpanel"
      tabIndex={0}
    />
  );
}
