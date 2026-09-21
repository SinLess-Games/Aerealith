import {
  isTerminalRunStatus,
  type RunRecord,
} from '@aerealith-ai/ai-orchestration';

import type { DurableObjectRunStore } from './run-store';

const DEFAULT_POLL_INTERVAL_MS = 500;
const MAX_STREAM_DURATION_MS = 5 * 60 * 1000;

export function createRunEventStream(
  runs: DurableObjectRunStore,
  runId: string,
  signal: AbortSignal,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastUpdatedAt: string | undefined;
      const startedAt = Date.now();

      try {
        while (
          !signal.aborted &&
          Date.now() - startedAt < MAX_STREAM_DURATION_MS
        ) {
          const run = await runs.get(runId);

          if (!run) {
            controller.enqueue(
              encoder.encode(
                sse('error', {
                  code: 'RUN_NOT_FOUND',
                  message: 'The AI run no longer exists.',
                }),
              ),
            );
            break;
          }

          if (run.updatedAt !== lastUpdatedAt) {
            lastUpdatedAt = run.updatedAt;
            controller.enqueue(
              encoder.encode(sse('run', toRunEvent(run))),
            );
          }

          if (isTerminalRunStatus(run.status)) {
            controller.enqueue(
              encoder.encode(
                sse('complete', {
                  id: run.id,
                  status: run.status,
                  updatedAt: run.updatedAt,
                }),
              ),
            );
            break;
          }

          await sleep(DEFAULT_POLL_INTERVAL_MS, signal);
        }

        if (
          !signal.aborted &&
          Date.now() - startedAt >= MAX_STREAM_DURATION_MS
        ) {
          controller.enqueue(
            encoder.encode(
              sse('reconnect', {
                runId,
                reason: 'stream_window_elapsed',
              }),
            ),
          );
        }
      } catch (error) {
        if (!signal.aborted) {
          controller.enqueue(
            encoder.encode(
              sse('error', {
                code: 'RUN_EVENT_STREAM_FAILED',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Run event stream failed.',
              }),
            ),
          );
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}

function toRunEvent(run: RunRecord) {
  return {
    id: run.id,
    status: run.status,
    capability: run.capability,
    updatedAt: run.updatedAt,
    ...(run.startedAt ? { startedAt: run.startedAt } : {}),
    ...(run.completedAt ? { completedAt: run.completedAt } : {}),
    ...(run.providerId ? { providerId: run.providerId } : {}),
    ...(run.modelId ? { modelId: run.modelId } : {}),
    ...(run.errorCode ? { errorCode: run.errorCode } : {}),
  };
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sleep(
  durationMs: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const timer = setTimeout(resolve, durationMs);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}
