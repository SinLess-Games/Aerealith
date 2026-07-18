// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider, ThemeToggle, useTheme } from './theme-provider'

function ThemeConsumer() {
  const { mode, setTheme, theme } = useTheme()

  return (
    <div>
      <output>{`${mode}:${theme}`}</output>
      <button type='button' onClick={() => setTheme('system')}>
        Use system
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const storage = new Map<string, string>()
  let systemDark = false

  beforeEach(() => {
    storage.clear()
    vi.stubGlobal('localStorage', {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    })
    systemDark = false
    listeners.clear()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        get matches() {
          return systemDark
        },
        addEventListener: (
          _event: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.add(listener),
        removeEventListener: (
          _event: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => listeners.delete(listener),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('color-scheme')
  })

  it('restores and persists an explicit theme', () => {
    localStorage.setItem('test-theme', 'dark')
    render(
      <ThemeProvider storageKey='test-theme'>
        <ThemeConsumer />
        <ThemeToggle lightIcon='sun' darkIcon='moon' />
      </ThemeProvider>,
    )

    expect(screen.getByText('dark:dark')).toBeTruthy()
    expect(document.documentElement.dataset['theme']).toBe('dark')
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    )
    expect(screen.getByText('light:light')).toBeTruthy()
    expect(localStorage.getItem('test-theme')).toBe('light')
  })

  it('tracks system preference changes and removes its listener', () => {
    const view = render(
      <ThemeProvider defaultTheme='system'>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByText('system:light')).toBeTruthy()

    systemDark = true
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent),
      )
    })
    expect(screen.getByText('system:dark')).toBeTruthy()

    view.unmount()
    expect(listeners.size).toBe(0)
  })

  it('supports non-persistent mode and an icon-only toggle', () => {
    render(
      <ThemeProvider defaultTheme='light' persist={false}>
        <ThemeConsumer />
        <ThemeToggle iconOnly lightIcon={<span>sun</span>} />
      </ThemeProvider>,
    )
    const toggle = screen.getByRole('button', { name: 'Switch to dark theme' })
    expect(toggle.textContent).toBe('sun')
    fireEvent.click(toggle)
    expect(screen.getByText('dark:dark')).toBeTruthy()
    expect(localStorage.getItem('aerealith-theme')).toBeNull()
  })

  it('honors a prevented toggle click', () => {
    render(
      <ThemeProvider defaultTheme='light'>
        <ThemeConsumer />
        <ThemeToggle onClick={(event) => event.preventDefault()} />
      </ThemeProvider>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to dark theme' }),
    )
    expect(screen.getByText('light:light')).toBeTruthy()
  })

  it('throws when the hook is used without a provider', () => {
    function InvalidConsumer() {
      useEffect(() => undefined, [])
      useTheme()
      return null
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    )
  })
})
