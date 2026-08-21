/** Generates an identifier with an optional log-friendly prefix. */
export function generateId(prefix?: string): string {
  const id = globalThis.crypto.randomUUID();
  const normalizedPrefix = prefix?.trim();

  return normalizedPrefix ? `${normalizedPrefix}_${id}` : id;
}
