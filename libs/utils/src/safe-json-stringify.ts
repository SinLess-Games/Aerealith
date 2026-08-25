export interface SafeJsonStringifyOptions {
  readonly indentation?: number;
  readonly circularReplacement?: string;
  readonly bigintAsString?: boolean;
}

export function safeJsonStringify(
  value: unknown,
  options?: SafeJsonStringifyOptions,
): string {
  const {
    bigintAsString = true,
    circularReplacement = '[CIRCULAR]',
    indentation,
  } = options ?? {};
  const seen = new WeakSet<object>();

  try {
    return (
      JSON.stringify(
        value,
        (_key, item: unknown) => {
          if (typeof item === 'bigint') {
            return bigintAsString ? item.toString() : Number(item);
          }

          if (item && typeof item === 'object') {
            if (seen.has(item)) return circularReplacement;
            seen.add(item);

            if (item instanceof Error) {
              return {
                ...item,
                name: item.name,
                message: item.message,
                stack: item.stack,
                cause: item.cause,
              };
            }

            if (item instanceof Map) return Object.fromEntries(item);
            if (item instanceof Set) return [...item];
          }

          return item;
        },
        normalizeIndentation(indentation),
      ) ?? 'null'
    );
  } catch {
    return '"[UNSERIALIZABLE]"';
  }
}

function normalizeIndentation(
  indentation: number | undefined,
): number | undefined {
  if (indentation === undefined) return undefined;
  if (!Number.isFinite(indentation)) return 0;

  return Math.min(10, Math.max(0, Math.trunc(indentation)));
}
