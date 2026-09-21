import type { CapabilityKind } from './capability';

export type RunPriority = 'interactive' | 'background' | 'batch';

export type ModelPreference = {
  provider?: string;
  model?: string;
  allowFallback?: boolean;
  maxCostUsd?: number;
  maxLatencyMs?: number;
};

export type OrchestrationRequest = {
  capability: CapabilityKind;
  input: unknown;
  tenantId?: string;
  actorId?: string;
  priority?: RunPriority;
  preferences?: ModelPreference;
  metadata?: Record<string, string>;
};

export type Usage = {
  inputUnits?: number;
  outputUnits?: number;
  totalUnits?: number;
  estimatedCostUsd?: number;
};

export type OrchestrationOutput = {
  content: unknown;
  artifacts?: string[];
  usage?: Usage;
  providerId: string;
  modelId: string;
};

export type RunStatus =
  | 'accepted'
  | 'planning'
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type RunRecord = {
  id: string;
  tenantId?: string;
  actorId?: string;
  status: RunStatus;
  capability: CapabilityKind;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  providerId?: string;
  modelId?: string;
  output?: OrchestrationOutput;
  errorCode?: string;
};
