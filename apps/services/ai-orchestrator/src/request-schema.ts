import { capabilityKinds } from '@aerealith-ai/ai-orchestration';
import { z } from 'zod';

const metadataSchema = z
  .record(z.string().max(64), z.string().max(512))
  .refine((value) => Object.keys(value).length <= 32, {
    message: 'metadata may contain at most 32 entries.',
  });

const preferencesSchema = z
  .object({
    provider: z.string().min(1).max(128).optional(),
    model: z.string().min(1).max(256).optional(),
    allowFallback: z.boolean().optional(),
    maxCostUsd: z.number().nonnegative().finite().optional(),
    maxLatencyMs: z.number().int().positive().max(3_600_000).optional(),
  })
  .optional();

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string().max(250_000),
  name: z.string().min(1).max(128).optional(),
});

const textInputSchema = z.object({
  messages: z.array(messageSchema).min(1).max(128),
  maxOutputTokens: z.number().int().positive().max(1_000_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  stop: z.array(z.string().max(256)).max(16).optional(),
  responseFormat: z.enum(['text', 'json']).optional(),
});

const codeInputSchema = z.object({
  mode: z.enum(['generate', 'edit', 'debug', 'review', 'test']),
  instruction: z.string().min(1).max(250_000),
  repository: z
    .object({
      url: z.url().optional(),
      ref: z.string().min(1).max(512).optional(),
      workspaceId: z.string().min(1).max(256).optional(),
    })
    .optional(),
  paths: z.array(z.string().min(1).max(4096)).max(256).optional(),
  constraints: z.array(z.string().min(1).max(4096)).max(128).optional(),
});

const embeddingInputSchema = z.object({
  texts: z.array(z.string().min(1).max(250_000)).min(1).max(256),
});

const rerankInputSchema = z.object({
  query: z.string().min(1).max(250_000),
  documents: z
    .array(
      z.object({
        id: z.string().min(1).max(512),
        text: z.string().min(1).max(250_000),
      }),
    )
    .min(1)
    .max(1_000),
  limit: z.number().int().positive().max(1_000).optional(),
});

const imageInputSchema = z.object({
  prompt: z.string().min(1).max(100_000),
  negativePrompt: z.string().max(100_000).optional(),
  width: z.number().int().min(64).max(8192).optional(),
  height: z.number().int().min(64).max(8192).optional(),
  count: z.number().int().min(1).max(8).optional(),
  seed: z.number().int().nonnegative().optional(),
  referenceArtifactIds: z.array(z.string().min(1).max(512)).max(16).optional(),
});

const audioInputSchema = z
  .object({
    text: z.string().min(1).max(250_000).optional(),
    prompt: z.string().min(1).max(100_000).optional(),
    voice: z.string().min(1).max(256).optional(),
    language: z.string().min(1).max(64).optional(),
    format: z.enum(['mp3', 'wav', 'flac', 'ogg']).optional(),
    durationSeconds: z.number().positive().max(7_200).optional(),
  })
  .refine((value) => Boolean(value.text || value.prompt), {
    message: 'Audio generation requires text or prompt.',
  });

const videoInputSchema = z.object({
  prompt: z.string().min(1).max(100_000),
  negativePrompt: z.string().max(100_000).optional(),
  durationSeconds: z.number().positive().max(1_800).optional(),
  width: z.number().int().min(64).max(8192).optional(),
  height: z.number().int().min(64).max(8192).optional(),
  fps: z.number().int().min(1).max(240).optional(),
  seed: z.number().int().nonnegative().optional(),
  referenceArtifactIds: z.array(z.string().min(1).max(512)).max(16).optional(),
});

const musicInputSchema = z.object({
  prompt: z.string().min(1).max(100_000),
  lyrics: z.string().max(250_000).optional(),
  instrumental: z.boolean().optional(),
  durationSeconds: z.number().positive().max(7_200).optional(),
  format: z.enum(['mp3', 'wav', 'flac']).optional(),
  seed: z.number().int().nonnegative().optional(),
});

const analyticsInputSchema = z.object({
  question: z.string().min(1).max(100_000),
  datasetArtifactIds: z.array(z.string().min(1).max(512)).max(256).optional(),
  data: z.unknown().optional(),
  requestedOutputs: z
    .array(z.enum(['summary', 'table', 'chart', 'statistics', 'code']))
    .max(16)
    .optional(),
});

const predictionInputSchema = z.object({
  objective: z.string().min(1).max(100_000),
  data: z.unknown().optional(),
  datasetArtifactIds: z.array(z.string().min(1).max(512)).max(256).optional(),
  target: z.string().min(1).max(512).optional(),
  horizon: z.number().int().positive().max(1_000_000).optional(),
  confidenceIntervals: z.boolean().optional(),
});

const retrievalInputSchema = z.object({
  namespace: z.string().min(1).max(256),
  query: z.string().min(1).max(250_000),
  limit: z.number().int().positive().max(1_000).optional(),
  filter: z.record(z.string(), z.unknown()).optional(),
});

const toolInputSchema = z.object({
  name: z.string().min(1).max(256),
  arguments: z.unknown(),
});

const capabilityInputSchemas = {
  text: textInputSchema,
  code: codeInputSchema,
  embedding: embeddingInputSchema,
  rerank: rerankInputSchema,
  image: imageInputSchema,
  audio: audioInputSchema,
  video: videoInputSchema,
  music: musicInputSchema,
  analytics: analyticsInputSchema,
  prediction: predictionInputSchema,
  retrieval: retrievalInputSchema,
  tool: toolInputSchema,
} as const;

export const orchestrationRequestSchema = z
  .object({
    capability: z.enum(capabilityKinds),
    input: z.unknown(),
    priority: z.enum(['interactive', 'background', 'batch']).optional(),
    preferences: preferencesSchema,
    metadata: metadataSchema.optional(),
  })
  .superRefine((request, context) => {
    const schema = capabilityInputSchemas[request.capability];
    const parsed = schema.safeParse(request.input);

    if (parsed.success) return;

    for (const issue of parsed.error.issues) {
      context.addIssue({
        ...issue,
        path: ['input', ...issue.path],
      });
    }
  })
  .transform((request) => {
    const schema = capabilityInputSchemas[request.capability];

    return {
      ...request,
      input: schema.parse(request.input),
    };
  });
