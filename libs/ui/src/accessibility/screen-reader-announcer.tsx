import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { VisuallyHidden } from '../primitives/accessibility/visually-hidden'

type Politeness = 'polite' | 'assertive'
type Announce = (message: string, politeness?: Politeness) => void
const AnnouncerContext = createContext<Announce | undefined>(undefined)

export function ScreenReaderAnnouncer({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Record<Politeness, string>>({
    polite: '',
    assertive: '',
  })
  const announce = useCallback<Announce>(
    (message, politeness = 'polite') =>
      setMessages((current) => ({ ...current, [politeness]: message })),
    [],
  )
  const value = useMemo(() => announce, [announce])
  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <VisuallyHidden>
        <div aria-atomic='true' aria-live='polite'>
          {messages.polite}
        </div>
        <div aria-atomic='true' aria-live='assertive'>
          {messages.assertive}
        </div>
      </VisuallyHidden>
    </AnnouncerContext.Provider>
  )
}

export function useAnnouncer() {
  const announce = useContext(AnnouncerContext)
  if (!announce)
    throw new Error('useAnnouncer must be used within a ScreenReaderAnnouncer')
  return announce
}
