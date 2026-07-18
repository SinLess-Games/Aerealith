'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark'
export type ThemeMode = Theme | 'system'

interface ThemeContextValue {
  /**
   * The currently applied light or dark theme.
   */
  theme: Theme

  /**
   * The selected theme preference.
   */
  mode: ThemeMode

  /**
   * Updates the selected theme preference.
   */
  setTheme: (theme: ThemeMode) => void

  /**
   * Switches between the explicit light and dark themes.
   */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DEFAULT_STORAGE_KEY = 'aerealith-theme'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): Theme {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function getInitialThemeMode(
  defaultTheme: ThemeMode,
  persist: boolean,
  storageKey: string,
): ThemeMode {
  if (typeof window === 'undefined' || !persist) {
    return defaultTheme
  }

  let storedTheme: string | null = null

  try {
    storedTheme = window.localStorage?.getItem(storageKey) ?? null
  } catch {
    // Storage can be unavailable in privacy-restricted browsers and test DOMs.
  }

  return isThemeMode(storedTheme) ? storedTheme : defaultTheme
}

export interface ThemeProviderProps {
  children: ReactNode

  /**
   * Theme mode used when no persisted preference exists.
   *
   * @default 'system'
   */
  defaultTheme?: ThemeMode

  /**
   * Whether the selected mode should be saved to localStorage.
   *
   * @default true
   */
  persist?: boolean

  /**
   * localStorage key used for the selected theme mode.
   *
   * @default 'aerealith-theme'
   */
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  persist = true,
  storageKey = DEFAULT_STORAGE_KEY,
}: Readonly<ThemeProviderProps>) {
  const [mode, setMode] = useState<ThemeMode>(() =>
    getInitialThemeMode(defaultTheme, persist, storageKey),
  )

  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme)

  const theme: Theme = mode === 'system' ? systemTheme : mode

  /**
   * Subscribe to changes in the operating-system color preference.
   */
  useEffect(() => {
    if (mode !== 'system' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function handleSystemThemeChange(event: MediaQueryListEvent) {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [mode])

  /**
   * Synchronize the resolved theme with the document root.
   */
  useEffect(() => {
    const root = document.documentElement

    root.dataset.theme = theme
    root.style.colorScheme = theme
  }, [theme])

  /**
   * Synchronize the selected theme mode with localStorage.
   */
  useEffect(() => {
    if (!persist) {
      return
    }

    try {
      window.localStorage?.setItem(storageKey, mode)
    } catch {
      // Persisting the preference is optional; the in-memory theme still works.
    }
  }, [mode, persist, storageKey])

  const setTheme = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode)
  }, [])

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => {
      const currentTheme =
        currentMode === 'system' ? getSystemTheme() : currentMode

      return currentTheme === 'dark' ? 'light' : 'dark'
    })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setTheme,
      theme,
      toggleTheme,
    }),
    [mode, setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export interface ThemeToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /**
   * Text displayed when the current theme is light.
   *
   * @default 'Switch to dark theme'
   */
  lightLabel?: string

  /**
   * Text displayed when the current theme is dark.
   *
   * @default 'Switch to light theme'
   */
  darkLabel?: string

  /**
   * Whether the visible button text should be hidden.
   *
   * The accessible label remains available to screen readers.
   *
   * @default false
   */
  iconOnly?: boolean

  /**
   * Optional icon rendered for the light theme.
   *
   * This should normally represent switching to dark mode.
   */
  lightIcon?: ReactNode

  /**
   * Optional icon rendered for the dark theme.
   *
   * This should normally represent switching to light mode.
   */
  darkIcon?: ReactNode
}

/**
 * Accessible button that toggles between light and dark themes.
 */
export function ThemeToggle({
  lightLabel = 'Switch to dark theme',
  darkLabel = 'Switch to light theme',
  iconOnly = false,
  lightIcon,
  darkIcon,
  type = 'button',
  onClick,
  ...props
}: Readonly<ThemeToggleProps>) {
  const { theme, toggleTheme } = useTheme()

  const isDark = theme === 'dark'
  const label = isDark ? darkLabel : lightLabel
  const icon = isDark ? darkIcon : lightIcon

  const handleClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = (
    event,
  ) => {
    onClick?.(event)

    if (!event.defaultPrevented) {
      toggleTheme()
    }
  }

  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      aria-pressed={isDark}
      data-theme-toggle=''
      data-theme={theme}
      onClick={handleClick}
    >
      {icon}

      {!iconOnly && <span>{label}</span>}
    </button>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
