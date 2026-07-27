/** Generates an identifier with an optional log-friendly prefix. */
export function generateId(prefix?: string): string {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const normalizedPrefix = prefix?.trim();

  return normalizedPrefix ? `${normalizedPrefix}_${id}` : id;
}
