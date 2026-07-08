// libs/utils/src/ui/keyboard.ts

/**
 * A framework-free subset shared by native DOM and React keyboard events.
 */
export interface KeyboardEventLike {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly key: string;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly target: EventTarget | null;
  preventDefault(): void;
}

/**
 * Modifier keys supported by Aerealith keyboard shortcut helpers.
 *
 * `primary` means:
 * - Command on Apple platforms
 * - Control on other platforms
 */
export type KeyboardShortcutModifier =
  'alt' | 'control' | 'meta' | 'primary' | 'shift';

/**
 * Defines a keyboard shortcut without coupling it to React or browser-only APIs.
 *
 * @example
 * const shortcut: KeyboardShortcut = {
 *   key: 'k',
 *   modifiers: ['primary'],
 * };
 */
export interface KeyboardShortcut {
  readonly key: string;
  readonly modifiers?: readonly KeyboardShortcutModifier[];
}

/**
 * Options controlling keyboard shortcut matching.
 */
export interface KeyboardShortcutMatchOptions {
  /**
   * Allows modifiers not explicitly listed in the shortcut.
   *
   * Defaults to `false`, which prevents `Ctrl+Shift+K` from matching a
   * `Ctrl+K` shortcut by accident.
   */
  readonly allowExtraModifiers?: boolean;

  /**
   * When true, the shortcut will not match while the user is typing in an
   * editable control such as an input, textarea, select, or contenteditable
   * region.
   *
   * Defaults to `false`.
   */
  readonly ignoreEditableTargets?: boolean;
}

/**
 * Physical keyboard modifier state.
 */
interface PhysicalModifiers {
  alt: boolean;
  control: boolean;
  meta: boolean;
  shift: boolean;
}

/**
 * Returns whether the current runtime appears to be an Apple platform.
 *
 * This is safe to call during SSR because it does not assume `navigator`
 * exists.
 */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const platform = `${navigator.platform} ${navigator.userAgent}`;

  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Returns whether an event includes the operating system's primary modifier.
 *
 * - Command on macOS, iOS, and iPadOS
 * - Control on Windows, Linux, ChromeOS, and most other platforms
 */
export function hasPrimaryModifier(event: KeyboardEventLike): boolean {
  return isApplePlatform() ? event.metaKey : event.ctrlKey;
}

/**
 * Returns whether an event target is an element where users are likely typing.
 *
 * This is useful for command-palette and global shortcut behavior so controls
 * such as `Ctrl+K` do not unexpectedly interrupt text entry.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  const element = getTargetElement(target);

  if (!element) {
    return false;
  }

  const editableElement = element.closest(
    'input, textarea, select, [contenteditable], [role="textbox"]',
  );

  if (!editableElement) {
    return false;
  }

  if (editableElement instanceof HTMLInputElement) {
    return !editableElement.readOnly && !editableElement.disabled;
  }

  if (
    editableElement instanceof HTMLTextAreaElement ||
    editableElement instanceof HTMLSelectElement
  ) {
    return !editableElement.disabled;
  }

  if (editableElement instanceof HTMLElement) {
    return (
      editableElement.isContentEditable || editableElement.role === 'textbox'
    );
  }

  return false;
}

/**
 * Normalizes browser keyboard values for reliable comparison.
 *
 * @example
 * normalizeKeyboardKey('K');
 * // 'k'
 *
 * normalizeKeyboardKey(' ');
 * // 'space'
 */
export function normalizeKeyboardKey(key: string): string {
  if (key === ' ') {
    return 'space';
  }

  const normalizedKey = key.trim().toLowerCase();

  switch (normalizedKey) {
    case 'esc':
      return 'escape';
    case 'left':
      return 'arrowleft';
    case 'right':
      return 'arrowright';
    case 'up':
      return 'arrowup';
    case 'down':
      return 'arrowdown';
    case 'return':
      return 'enter';
    default:
      return normalizedKey;
  }
}

/**
 * Returns whether a keyboard event matches a declared Aerealith shortcut.
 *
 * @example
 * if (
 *   matchesKeyboardShortcut(event, {
 *     key: 'k',
 *     modifiers: ['primary'],
 *   })
 * ) {
 *   openCommandPalette();
 * }
 */
export function matchesKeyboardShortcut(
  event: KeyboardEventLike,
  shortcut: KeyboardShortcut,
  options: KeyboardShortcutMatchOptions = {},
): boolean {
  if (options.ignoreEditableTargets && isEditableTarget(event.target)) {
    return false;
  }

  if (normalizeKeyboardKey(event.key) !== normalizeKeyboardKey(shortcut.key)) {
    return false;
  }

  const requiredModifiers = getRequiredPhysicalModifiers(
    shortcut.modifiers ?? [],
  );
  const activeModifiers = getActivePhysicalModifiers(event);

  if (!options.allowExtraModifiers) {
    return (
      activeModifiers.alt === requiredModifiers.alt &&
      activeModifiers.control === requiredModifiers.control &&
      activeModifiers.meta === requiredModifiers.meta &&
      activeModifiers.shift === requiredModifiers.shift
    );
  }

  return (
    (!requiredModifiers.alt || activeModifiers.alt) &&
    (!requiredModifiers.control || activeModifiers.control) &&
    (!requiredModifiers.meta || activeModifiers.meta) &&
    (!requiredModifiers.shift || activeModifiers.shift)
  );
}

/**
 * Prevents the browser default and returns true when a shortcut matches.
 *
 * @example
 * if (
 *   preventDefaultForShortcut(event, {
 *     key: 'k',
 *     modifiers: ['primary'],
 *   })
 * ) {
 *   openCommandPalette();
 * }
 */
export function preventDefaultForShortcut(
  event: KeyboardEventLike,
  shortcut: KeyboardShortcut,
  options: KeyboardShortcutMatchOptions = {},
): boolean {
  if (!matchesKeyboardShortcut(event, shortcut, options)) {
    return false;
  }

  event.preventDefault();

  return true;
}

/**
 * Formats a keyboard shortcut for display in the current operating system's
 * familiar notation.
 *
 * @example
 * formatKeyboardShortcut({
 *   key: 'k',
 *   modifiers: ['primary', 'shift'],
 * });
 *
 * // macOS: "⌘ ⇧ K"
 * // Other platforms: "Ctrl + Shift + K"
 */
export function formatKeyboardShortcut(shortcut: KeyboardShortcut): string {
  const isApple = isApplePlatform();
  const modifiers = new Set(shortcut.modifiers ?? []);
  const labels: string[] = [];

  for (const modifier of [
    'primary',
    'control',
    'meta',
    'alt',
    'shift',
  ] as const) {
    if (!modifiers.has(modifier)) {
      continue;
    }

    const label = getModifierLabel(modifier, isApple);

    if (label && !labels.includes(label)) {
      labels.push(label);
    }
  }

  labels.push(formatKeyboardKey(shortcut.key));

  return labels.join(isApple ? ' ' : ' + ');
}

function getTargetElement(target: EventTarget | null): Element | undefined {
  if (typeof Element === 'undefined' || !(target instanceof Element)) {
    return undefined;
  }

  return target;
}

function getActivePhysicalModifiers(
  event: KeyboardEventLike,
): PhysicalModifiers {
  return {
    alt: event.altKey,
    control: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  };
}

function getRequiredPhysicalModifiers(
  modifiers: readonly KeyboardShortcutModifier[],
): PhysicalModifiers {
  const requiredModifiers: PhysicalModifiers = {
    alt: false,
    control: false,
    meta: false,
    shift: false,
  };

  const isApple = isApplePlatform();

  for (const modifier of modifiers) {
    switch (modifier) {
      case 'alt':
        requiredModifiers.alt = true;
        break;

      case 'control':
        requiredModifiers.control = true;
        break;

      case 'meta':
        requiredModifiers.meta = true;
        break;

      case 'primary':
        if (isApple) {
          requiredModifiers.meta = true;
        } else {
          requiredModifiers.control = true;
        }
        break;

      case 'shift':
        requiredModifiers.shift = true;
        break;
    }
  }

  return requiredModifiers;
}

function getModifierLabel(
  modifier: KeyboardShortcutModifier,
  isApple: boolean,
): string | undefined {
  if (isApple) {
    switch (modifier) {
      case 'alt':
        return '⌥';
      case 'control':
        return '⌃';
      case 'meta':
      case 'primary':
        return '⌘';
      case 'shift':
        return '⇧';
    }
  }

  switch (modifier) {
    case 'alt':
      return 'Alt';
    case 'control':
      return 'Ctrl';
    case 'meta':
      return 'Meta';
    case 'primary':
      return 'Ctrl';
    case 'shift':
      return 'Shift';
  }
}

function formatKeyboardKey(key: string): string {
  const normalizedKey = normalizeKeyboardKey(key);

  switch (normalizedKey) {
    case 'arrowdown':
      return '↓';
    case 'arrowleft':
      return '←';
    case 'arrowright':
      return '→';
    case 'arrowup':
      return '↑';
    case 'backspace':
      return 'Backspace';
    case 'delete':
      return 'Delete';
    case 'enter':
      return 'Enter';
    case 'escape':
      return 'Esc';
    case 'space':
      return 'Space';
    case 'tab':
      return 'Tab';
    default:
      return normalizedKey.length === 1
        ? normalizedKey.toUpperCase()
        : normalizedKey;
  }
}
