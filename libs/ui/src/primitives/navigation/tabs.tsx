import {
  createContext,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
} from 'react'
import { cn } from '../../lib/cn'
type TabsContextValue = {
  value: string
  setValue: (value: string) => void
  orientation: 'horizontal' | 'vertical'
}
const TabsContext = createContext<TabsContextValue | undefined>(undefined)
function useTabs() {
  const value = useContext(TabsContext)
  if (!value) throw new Error('Tabs components must be used within Tabs')
  return value
}
export interface TabsProps extends ComponentPropsWithoutRef<'div'> {
  value?: string
  defaultValue: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
}
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  className,
  ...props
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal
  const setValue = (next: string) => {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue, orientation }}>
      <div
        {...props}
        className={cn(
          'flex gap-2',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
          className,
        )}
        data-orientation={orientation}
        data-slot='tabs'
      />
    </TabsContext.Provider>
  )
}
export function TabsList({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const { orientation } = useTabs()
  return (
    <div
      {...props}
      aria-orientation={orientation}
      className={cn(
        'inline-flex gap-1 rounded-md bg-[var(--ae-muted)] p-1',
        orientation === 'vertical' && 'flex-col',
        className,
      )}
      data-slot='tabs-list'
      role='tablist'
    >
      {children}
    </div>
  )
}
export interface TabsTriggerProps extends ComponentPropsWithoutRef<'button'> {
  value: string
}
export function TabsTrigger({
  value,
  className,
  onClick,
  ...props
}: TabsTriggerProps) {
  const tabs = useTabs()
  const selected = tabs.value === value
  return (
    <button
      {...props}
      aria-selected={selected}
      className={cn(
        'rounded px-3 py-1.5 text-sm',
        selected && 'bg-[var(--ae-surface)]',
        className,
      )}
      data-slot='tabs-trigger'
      onClick={(event) => {
        tabs.setValue(value)
        onClick?.(event)
      }}
      role='tab'
      tabIndex={selected ? 0 : -1}
      type='button'
    />
  )
}
export interface TabsContentProps extends ComponentPropsWithoutRef<'div'> {
  value: string
}
export function TabsContent({ value, ...props }: TabsContentProps) {
  const tabs = useTabs()
  if (tabs.value !== value) return null
  return <div {...props} data-slot='tabs-content' role='tabpanel' />
}
