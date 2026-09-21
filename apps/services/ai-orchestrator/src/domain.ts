export const capabilityKinds = [
  'text',
  'code',
  'image',
  'audio',
  'video',
  'music',
  'analytics',
  'prediction',
  'retrieval',
  'tool',
] as const;

export type CapabilityKind = (typeof capabilityKinds)[number];

export type OrchestrationRequest = {
  capability: CapabilityKind;
  input: unknown;
  model?: string;
  metadata?: Record<string, string>;
};

export type OrchestrationResult = {
  runId: string;
  status: 'accepted';
  capability: CapabilityKind;
  createdAt: string;
};
