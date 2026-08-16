import {
  createContext,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn'
const MenuContext = createContext<
  { open: boolean; setOpen: (open: boolean) => void } | undefined
>(undefined)
function useMenu() {
  const menu = useContext(MenuContext)
  if (!menu)
    throw new Error('DropdownMenu components must be used within DropdownMenu')
  return menu
}
export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      {children}
    </MenuContext.Provider>
  )
}
export function DropdownMenuTrigger({
  onClick,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  const menu = useMenu()
  return (
    <button
      {...props}
      aria-expanded={menu.open}
      aria-haspopup='menu'
      data-slot='dropdown-menu-trigger'
      onClick={(event) => {
        menu.setOpen(!menu.open)
        onClick?.(event)
      }}
      type='button'
    />
  )
}
export function DropdownMenuContent({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const menu = useMenu()
  if (!menu.open) return null
  return (
    <div
      {...props}
      className={cn(
        'z-50 min-w-40 rounded-md border border-[var(--ae-border)] bg-[var(--ae-surface)] p-1 shadow-lg',
        className,
      )}
      data-slot='dropdown-menu-content'
      role='menu'
    />
  )
}
export function DropdownMenuItem({
  className,
  onClick,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  const menu = useMenu()
  return (
    <button
      {...props}
      className={cn(
        'flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--ae-muted)] disabled:opacity-50',
        className,
      )}
      data-slot='dropdown-menu-item'
      onClick={(event) => {
        menu.setOpen(false)
        onClick?.(event)
      }}
      role='menuitem'
      type='button'
    />
  )
}
export function DropdownMenuLabel(props: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} data-slot='dropdown-menu-label' />
}
export function DropdownMenuSeparator(props: ComponentPropsWithoutRef<'hr'>) {
  return <hr {...props} data-slot='dropdown-menu-separator' />
}
export function DropdownMenuGroup({ children }: { children: ReactNode }) {
  return <div role='group'>{children}</div>
}
export const DropdownMenuPortal = ({ children }: { children: ReactNode }) => (
  <>{children}</>
)
export const DropdownMenuShortcut = (
  props: ComponentPropsWithoutRef<'span'>,
) => <span {...props} data-slot='dropdown-menu-shortcut' />
export const DropdownMenuSub = DropdownMenu
export const DropdownMenuSubTrigger = DropdownMenuTrigger
export const DropdownMenuSubContent = DropdownMenuContent
export const DropdownMenuCheckboxItem = DropdownMenuItem
export const DropdownMenuRadioItem = DropdownMenuItem
export const DropdownMenuRadioGroup = DropdownMenuGroup
