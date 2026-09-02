/** Adds a stable Discord namespace and safe attributes to shared trace spans. */
import {
  startSpan,
  withSpan,
  type SpanHandle,
} from '@aerealith-ai/observability';

export type DiscordTraceAttributes = Readonly<
  Record<string, string | number | boolean | undefined>
>;

/** Runs work in a Discord-namespaced OpenTelemetry span. */
export function withDiscordTrace<T>(
  operation: string,
  execute: () => T,
  attributes: DiscordTraceAttributes = {},
): T {
  // Normalization keeps operation names valid and bounded across exporters.
  return withSpan(`discord.${normalizeOperation(operation)}`, execute, {
    attributes: normalizeAttributes(attributes),
  });
}

/** Starts a Discord span for callback-style APIs that cannot use a wrapper. */
export function startDiscordTrace(
  operation: string,
  attributes: DiscordTraceAttributes = {},
): SpanHandle {
  // Manual handles support event/callback APIs whose work cannot be expressed
  // as one synchronous or promise-returning wrapper.
  return startSpan(`discord.${normalizeOperation(operation)}`, {
    attributes: normalizeAttributes(attributes),
  });
}

function normalizeAttributes(
  attributes: DiscordTraceAttributes,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [name, value] of Object.entries(attributes)) {
    // Undefined attributes are omitted because OpenTelemetry does not accept
    // them; names are scoped to avoid collisions with generic service spans.
    if (value === undefined) continue;
    result[`discord.${normalizeAttributeName(name)}`] = value;
  }
  return result;
}

function normalizeOperation(operation: string): string {
  const normalized = operation
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/gu, '_')
    .slice(0, 100);
  return normalized || 'unknown';
}

function normalizeAttributeName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/gu, '_')
    .slice(0, 100);
  return normalized || 'attribute';
}
