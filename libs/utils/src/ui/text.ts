// libs/utils/src/ui/text.ts

/**
 * Options for formatting a readable text list.
 */
export interface TextListOptions {
  /**
   * The word used before the final item.
   *
   * @defaultValue 'and'
   */
  readonly conjunction?: string;

  /**
   * Whether lists with three or more values use an Oxford comma.
   *
   * @defaultValue true
   */
  readonly useOxfordComma?: boolean;
}

/**
 * Truncates text to a maximum length and appends an ellipsis when needed.
 *
 * @example
 * truncateText('Aerealith AI is a connected command center.', 20);
 * // 'Aerealith AI is a…'
 */
export function truncateText(
  value: string,
  maximumLength: number,
  ellipsis = '…',
): string {
  if (!Number.isInteger(maximumLength) || maximumLength < 1) {
    throw new RangeError('maximumLength must be a positive integer.');
  }

  if (value.length <= maximumLength) {
    return value;
  }

  if (ellipsis.length >= maximumLength) {
    return ellipsis.slice(0, maximumLength);
  }

  return `${value.slice(0, maximumLength - ellipsis.length).trimEnd()}${ellipsis}`;
}

/**
 * Returns a compact uppercase initial string from a name or label.
 *
 * @example
 * getInitials('Aerealith AI');
 * // 'AA'
 *
 * getInitials('Timothy Andrew Pierce');
 * // 'TA'
 */
export function getInitials(value: string, maximumInitials = 2): string {
  if (!Number.isInteger(maximumInitials) || maximumInitials < 1) {
    throw new RangeError('maximumInitials must be a positive integer.');
  }

  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '';
  }

  return words
    .slice(0, maximumInitials)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toLocaleUpperCase();
}

/**
 * Converts a machine-readable identifier into readable UI text.
 *
 * @example
 * humanizeIdentifier('discord_server_settings');
 * // 'Discord server settings'
 *
 * humanizeIdentifier('APIResponseStatus');
 * // 'Api response status'
 */
export function humanizeIdentifier(value: string): string {
  const normalizedValue = value
    .trim()
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();

  if (normalizedValue.length === 0) {
    return '';
  }

  return `${normalizedValue[0]?.toLocaleUpperCase() ?? ''}${normalizedValue.slice(
    1,
  )}`;
}

/**
 * Returns a singular or plural label based on a count.
 *
 * @example
 * pluralize(1, 'server');
 * // 'server'
 *
 * pluralize(4, 'server');
 * // 'servers'
 */
export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return Math.abs(count) === 1 ? singular : plural;
}

/**
 * Formats a count together with a singular or plural label.
 *
 * @example
 * formatCount(1, 'integration');
 * // '1 integration'
 *
 * formatCount(3, 'integration');
 * // '3 integrations'
 */
export function formatCount(
  count: number,
  singular: string,
  plural?: string,
): string {
  return `${count.toLocaleString()} ${pluralize(count, singular, plural)}`;
}

/**
 * Joins readable values into a natural-language list.
 *
 * This intentionally avoids `Intl.ListFormat` so `libs/utils` remains
 * compatible with the repository's current TypeScript library configuration.
 *
 * @example
 * formatTextList(['Discord', 'GitHub', 'Cloudflare']);
 * // 'Discord, GitHub, and Cloudflare'
 *
 * formatTextList(['Discord', 'GitHub'], { conjunction: 'or' });
 * // 'Discord or GitHub'
 */
export function formatTextList(
  values: readonly string[],
  options: TextListOptions = {},
): string {
  const normalizedValues = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const conjunction = options.conjunction?.trim() || 'and';
  const useOxfordComma = options.useOxfordComma ?? true;

  if (normalizedValues.length === 0) {
    return '';
  }

  if (normalizedValues.length === 1) {
    return normalizedValues[0] ?? '';
  }

  if (normalizedValues.length === 2) {
    return `${normalizedValues[0]} ${conjunction} ${normalizedValues[1]}`;
  }

  const finalValue = normalizedValues.at(-1) ?? '';
  const leadingValues = normalizedValues.slice(0, -1).join(', ');
  const separator = useOxfordComma ? ',' : '';

  return `${leadingValues}${separator} ${conjunction} ${finalValue}`;
}

/**
 * Converts a text value into a URL-safe slug.
 *
 * @example
 * toSlug('Aerealith AI: Command Center');
 * // 'aerealith-ai-command-center'
 */
export function toSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Returns the first non-empty string from a list of candidates.
 *
 * Useful for labels, titles, display names, and fallback text.
 *
 * @example
 * getFirstTextValue('', undefined, 'Aerealith AI');
 * // 'Aerealith AI'
 */
export function getFirstTextValue(
  ...values: readonly (string | null | undefined)[]
): string | undefined {
  return values.find(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0,
  );
}
