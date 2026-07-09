// libs/utils/src/ui/a11y.ts

/**
 * A value that can contribute one or more IDs to an ARIA ID reference list.
 *
 * Use this with attributes such as:
 * - aria-describedby
 * - aria-labelledby
 * - aria-controls
 * - aria-owns
 */
export type AriaIdReference = string | null | undefined | false

/**
 * Combines ARIA ID references into a clean, unique, space-separated value.
 *
 * Returns `undefined` when no valid IDs are provided, which works cleanly
 * with JSX and native DOM attribute assignment.
 *
 * @example
 * const describedBy = joinAriaIds(
 *   'email-description',
 *   hasError && 'email-error',
 * );
 *
 * // "email-description email-error"
 */
export function joinAriaIds(
  ...references: readonly AriaIdReference[]
): string | undefined {
  const ids = new Set<string>()

  for (const reference of references) {
    if (typeof reference !== 'string') {
      continue
    }

    for (const id of reference.trim().split(/\s+/)) {
      if (id.length > 0) {
        ids.add(id)
      }
    }
  }

  const value = [...ids].join(' ')

  return value.length > 0 ? value : undefined
}

/**
 * Converts an optional boolean to a valid ARIA boolean string.
 *
 * `undefined` is preserved so callers can omit an ARIA attribute entirely
 * when it does not apply.
 *
 * @example
 * toAriaBoolean(isExpanded);
 * // "true" | "false" | undefined
 */
export function toAriaBoolean(
  value: boolean | null | undefined,
): 'true' | 'false' | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  return value ? 'true' : 'false'
}

/**
 * Converts an optional checkbox-like state to a valid ARIA checked value.
 *
 * @example
 * toAriaChecked('mixed');
 * // "mixed"
 */
export function toAriaChecked(
  value: boolean | 'mixed' | null | undefined,
): 'true' | 'false' | 'mixed' | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (value === 'mixed') {
    return 'mixed'
  }

  return value ? 'true' : 'false'
}

/**
 * Returns an accessible label for an icon-only control.
 *
 * Throws when the label is empty so inaccessible controls are caught early
 * during development rather than silently reaching production.
 *
 * @example
 * const ariaLabel = requireAccessibleLabel('Open navigation menu');
 */
export function requireAccessibleLabel(label: string): string {
  const normalizedLabel = label.trim()

  if (normalizedLabel.length === 0) {
    throw new Error(
      'Accessible controls must include a non-empty label for assistive technologies.',
    )
  }

  return normalizedLabel
}
