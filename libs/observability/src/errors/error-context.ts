import type { LogRecordContext } from '@aerealith-ai/core';

import { normalizeLogContext } from '../logger/utils/normalize-log-context';
import type { ErrorContext } from './error.types';

/** Normalizes arbitrary error metadata before it reaches logs or reporters. */
export function normalizeErrorContext(
  context: ErrorContext | undefined,
): LogRecordContext {
  return normalizeLogContext(context);
}
