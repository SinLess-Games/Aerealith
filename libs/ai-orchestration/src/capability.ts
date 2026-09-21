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
