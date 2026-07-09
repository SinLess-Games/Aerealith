// @vitest-environment jsdom

// libs/utils/src/ui/keyboard.spec.ts

import { describe, expect, it, vi } from 'vitest'

import {
  formatKeyboardShortcut,
  hasPrimaryModifier,
  isApplePlatform,
  isEditableTarget,
  matchesKeyboardShortcut,
  normalizeKeyboardKey,
  preventDefaultForShortcut,
  type KeyboardEventLike,
} from './keyboard'

function createKeyboardEvent(
  overrides: Partial<KeyboardEventLike> = {},
): KeyboardEventLike {
  return {
    altKey: false,
    ctrlKey: false,
    key: '',
    metaKey: false,
    shiftKey: false,
    target: null,
    preventDefault: vi.fn(),
    ...overrides,
  }
}

describe('isApplePlatform', () => {
  it('returns a boolean without throwing', () => {
    expect(typeof isApplePlatform()).toBe('boolean')
  })
})

describe('hasPrimaryModifier', () => {
  it('uses Meta on Apple platforms and Control elsewhere', () => {
    const event = createKeyboardEvent({
      ctrlKey: true,
      metaKey: false,
    })

    expect(hasPrimaryModifier(event)).toBe(!isApplePlatform())
  })

  it('recognizes Meta as primary on Apple platforms', () => {
    const event = createKeyboardEvent({
      ctrlKey: false,
      metaKey: true,
    })

    expect(hasPrimaryModifier(event)).toBe(isApplePlatform())
  })
})

describe('normalizeKeyboardKey', () => {
  it.each([
    ['K', 'k'],
    ['Escape', 'escape'],
    ['Esc', 'escape'],
    ['ArrowLeft', 'arrowleft'],
    ['left', 'arrowleft'],
    ['ArrowRight', 'arrowright'],
    ['right', 'arrowright'],
    ['ArrowUp', 'arrowup'],
    ['up', 'arrowup'],
    ['ArrowDown', 'arrowdown'],
    ['down', 'arrowdown'],
    ['Return', 'enter'],
    [' ', 'space'],
    ['Tab', 'tab'],
  ])('normalizes %s as %s', (value, expected) => {
    expect(normalizeKeyboardKey(value)).toBe(expected)
  })
})

describe('isEditableTarget', () => {
  it('returns false for a null target', () => {
    expect(isEditableTarget(null)).toBe(false)
  })

  it('returns true for an editable input', () => {
    const input = document.createElement('input')

    expect(isEditableTarget(input)).toBe(true)
  })

  it('returns false for a readonly input', () => {
    const input = document.createElement('input')

    input.readOnly = true

    expect(isEditableTarget(input)).toBe(false)
  })

  it('returns false for a disabled input', () => {
    const input = document.createElement('input')

    input.disabled = true

    expect(isEditableTarget(input)).toBe(false)
  })

  it('returns true for an enabled textarea', () => {
    const textarea = document.createElement('textarea')

    expect(isEditableTarget(textarea)).toBe(true)
  })

  it('returns false for a disabled textarea', () => {
    const textarea = document.createElement('textarea')

    textarea.disabled = true

    expect(isEditableTarget(textarea)).toBe(false)
  })

  it('returns true for an enabled select', () => {
    const select = document.createElement('select')

    expect(isEditableTarget(select)).toBe(true)
  })

  it('returns false for a disabled select', () => {
    const select = document.createElement('select')

    select.disabled = true

    expect(isEditableTarget(select)).toBe(false)
  })

  it('returns true for a contenteditable element', () => {
    const element = document.createElement('div')

    element.setAttribute('contenteditable', 'true')

    Object.defineProperty(element, 'isContentEditable', {
      configurable: true,
      value: true,
    })

    expect(isEditableTarget(element)).toBe(true)
  })

  it('returns true for an element inside an editable input target', () => {
    const input = document.createElement('input')
    const wrapper = document.createElement('div')

    wrapper.append(input)

    expect(isEditableTarget(input)).toBe(true)
  })

  it('returns false for a non-editable element', () => {
    const element = document.createElement('button')

    expect(isEditableTarget(element)).toBe(false)
  })
})

describe('matchesKeyboardShortcut', () => {
  it('matches a plain key with no modifiers', () => {
    const event = createKeyboardEvent({
      key: 'k',
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 'k',
      }),
    ).toBe(true)
  })

  it('matches keys case-insensitively', () => {
    const event = createKeyboardEvent({
      key: 'K',
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 'k',
      }),
    ).toBe(true)
  })

  it('does not match a different key', () => {
    const event = createKeyboardEvent({
      key: 'j',
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 'k',
      }),
    ).toBe(false)
  })

  it('matches a control shortcut', () => {
    const event = createKeyboardEvent({
      ctrlKey: true,
      key: 's',
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 's',
        modifiers: ['control'],
      }),
    ).toBe(true)
  })

  it('does not match when required modifiers are missing', () => {
    const event = createKeyboardEvent({
      key: 's',
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 's',
        modifiers: ['control'],
      }),
    ).toBe(false)
  })

  it('does not match when extra modifiers are present by default', () => {
    const event = createKeyboardEvent({
      ctrlKey: true,
      key: 's',
      shiftKey: true,
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 's',
        modifiers: ['control'],
      }),
    ).toBe(false)
  })

  it('matches when extra modifiers are allowed', () => {
    const event = createKeyboardEvent({
      ctrlKey: true,
      key: 's',
      shiftKey: true,
    })

    expect(
      matchesKeyboardShortcut(
        event,
        {
          key: 's',
          modifiers: ['control'],
        },
        {
          allowExtraModifiers: true,
        },
      ),
    ).toBe(true)
  })

  it('matches the platform primary shortcut', () => {
    const event = createKeyboardEvent({
      ctrlKey: !isApplePlatform(),
      key: 'k',
      metaKey: isApplePlatform(),
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 'k',
        modifiers: ['primary'],
      }),
    ).toBe(true)
  })

  it('does not match primary when the wrong platform modifier is pressed', () => {
    const event = createKeyboardEvent({
      ctrlKey: isApplePlatform(),
      key: 'k',
      metaKey: !isApplePlatform(),
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 'k',
        modifiers: ['primary'],
      }),
    ).toBe(false)
  })

  it('does not match shortcuts in editable targets when requested', () => {
    const input = document.createElement('input')

    const event = createKeyboardEvent({
      ctrlKey: !isApplePlatform(),
      key: 'k',
      metaKey: isApplePlatform(),
      target: input,
    })

    expect(
      matchesKeyboardShortcut(
        event,
        {
          key: 'k',
          modifiers: ['primary'],
        },
        {
          ignoreEditableTargets: true,
        },
      ),
    ).toBe(false)
  })

  it('still matches shortcuts in editable targets when not ignored', () => {
    const input = document.createElement('input')

    const event = createKeyboardEvent({
      ctrlKey: !isApplePlatform(),
      key: 'k',
      metaKey: isApplePlatform(),
      target: input,
    })

    expect(
      matchesKeyboardShortcut(event, {
        key: 'k',
        modifiers: ['primary'],
      }),
    ).toBe(true)
  })
})

describe('preventDefaultForShortcut', () => {
  it('prevents the browser default for a matching shortcut', () => {
    const event = createKeyboardEvent({
      ctrlKey: !isApplePlatform(),
      key: 'k',
      metaKey: isApplePlatform(),
    })

    expect(
      preventDefaultForShortcut(event, {
        key: 'k',
        modifiers: ['primary'],
      }),
    ).toBe(true)

    expect(event.preventDefault).toHaveBeenCalledOnce()
  })

  it('does not prevent the browser default for a non-matching shortcut', () => {
    const event = createKeyboardEvent({
      key: 'j',
    })

    expect(
      preventDefaultForShortcut(event, {
        key: 'k',
      }),
    ).toBe(false)

    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})

describe('formatKeyboardShortcut', () => {
  it('formats a plain key shortcut', () => {
    expect(
      formatKeyboardShortcut({
        key: 'k',
      }),
    ).toBe('K')
  })

  it('formats platform primary shortcuts', () => {
    expect(
      formatKeyboardShortcut({
        key: 'k',
        modifiers: ['primary'],
      }),
    ).toBe(isApplePlatform() ? '⌘ K' : 'Ctrl + K')
  })

  it('formats primary and shift shortcuts', () => {
    expect(
      formatKeyboardShortcut({
        key: 'k',
        modifiers: ['primary', 'shift'],
      }),
    ).toBe(isApplePlatform() ? '⌘ ⇧ K' : 'Ctrl + Shift + K')
  })

  it('formats arrow keys with directional symbols', () => {
    expect(
      formatKeyboardShortcut({
        key: 'ArrowDown',
      }),
    ).toBe('↓')
  })

  it('formats special keyboard keys clearly', () => {
    expect(
      formatKeyboardShortcut({
        key: 'Escape',
      }),
    ).toBe('Esc')

    expect(
      formatKeyboardShortcut({
        key: ' ',
      }),
    ).toBe('Space')

    expect(
      formatKeyboardShortcut({
        key: 'Enter',
      }),
    ).toBe('Enter')
  })

  it('does not duplicate displayed primary/meta labels on Apple platforms', () => {
    const result = formatKeyboardShortcut({
      key: 'k',
      modifiers: ['primary', 'meta'],
    })

    expect(result).toBe(isApplePlatform() ? '⌘ K' : 'Ctrl + Meta + K')
  })
})
