export function truncate(
  value: string,
  maximumLength: number,
  suffix?: string,
): string;
/** Truncates text to a maximum length, including its omission marker. */
export function truncate(
  value: string,
  maxLength: number,
  omission = '…',
): string {
  if (!Number.isSafeInteger(maxLength) || maxLength < 0) {
    throw new RangeError('maxLength must be a non-negative safe integer');
  }

  if (value.length <= maxLength) return value;
  if (maxLength === 0) return '';

  const marker = omission.slice(0, maxLength);
  return `${value.slice(0, Math.max(0, maxLength - marker.length))}${marker}`;
}
