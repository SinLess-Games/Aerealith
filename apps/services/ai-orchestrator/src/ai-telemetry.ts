import type {
  CapabilityKind,
  OrchestrationOutput,
} from '@aerealith-ai/ai-orchestration';

type AiTelemetryBase = {
  runId: string;
  capability: CapabilityKind;
};

export function recordAiRunStarted(event: AiTelemetryBase): void {
  writeTelemetry({
    event: 'ai.run.started',
    ...event,
  });
}

export function recordAiRunSucceeded(
  event: AiTelemetryBase & {
    durationMs: number;
    output: OrchestrationOutput;
  },
): void {
  writeTelemetry({
    event: 'ai.run.succeeded',
    runId: event.runId,
    capability: event.capability,
    durationMs: Math.max(0, Math.round(event.durationMs)),
    providerId: event.output.providerId,
    modelId: event.output.modelId,
    inputUnits: event.output.usage?.inputUnits,
    outputUnits: event.output.usage?.outputUnits,
    totalUnits: event.output.usage?.totalUnits,
    estimatedCostUsd: event.output.usage?.estimatedCostUsd,
    artifactCount: event.output.artifacts?.length ?? 0,
  });
}

export function recordAiRunFailed(
  event: AiTelemetryBase & {
    durationMs: number;
    errorCode: string;
  },
): void {
  writeTelemetry({
    event: 'ai.run.failed',
    runId: event.runId,
    capability: event.capability,
    durationMs: Math.max(0, Math.round(event.durationMs)),
    errorCode: event.errorCode,
  });
}

function writeTelemetry(
  fields: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({
      telemetry: 'aerealith.ai',
      timestamp: new Date().toISOString(),
      ...removeUndefined(fields),
    }),
  );
}

function removeUndefined(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );
}
