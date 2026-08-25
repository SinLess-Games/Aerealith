/** Recursively freezes an object graph while tolerating cycles. */
export function deepFreeze<T>(value: T): Readonly<T> {
  const seen = new WeakSet<object>();

  const freeze = (candidate: unknown): void => {
    if (
      candidate === null ||
      (typeof candidate !== 'object' && typeof candidate !== 'function') ||
      seen.has(candidate)
    ) {
      return;
    }

    seen.add(candidate);

    for (const key of Reflect.ownKeys(candidate)) {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);

      if (descriptor && 'value' in descriptor) freeze(descriptor.value);
    }

    Object.freeze(candidate);
  };

  freeze(value);
  return value;
}
