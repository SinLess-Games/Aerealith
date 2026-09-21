export const capabilityKinds = [
  'text',
  'code',
  'embedding',
  'rerank',
  'image',
  'audio',
  'video',
  'music',
  'analytics',
  'prediction',
  'knowledge-ingest',
  'retrieval',
  'tool',
] as const;

export type CapabilityKind = (typeof capabilityKinds)[number];
