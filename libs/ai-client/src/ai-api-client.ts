import type {
  CapabilityKind,
  OrchestrationRequest,
  RunRecord,
} from '@aerealith-ai/ai-orchestration';

export type AiApiClientOptions = {
  baseUrl?: string;
  fetchImplementation?: typeof globalThis.fetch;
};

export type AiCapabilityStatus = {
  declared: readonly CapabilityKind[];
  executable: readonly CapabilityKind[];
};

export type AiModelSummary = {
  id: string;
  providerId: string;
  capabilities: readonly CapabilityKind[];
  priority?: number;
  supportsStreaming?: boolean;
  contextWindow?: number;
  embeddingDimensions?: number;
  inputCostPerMillionUnitsUsd?: number;
  outputCostPerMillionUnitsUsd?: number;
};

export type AiToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  requiresApproval?: boolean;
};

export type AiUsageSummary = {
  day: string;
  runs: number;
  inputUnits: number;
  outputUnits: number;
  totalUnits: number;
  estimatedCostUsd: number;
  limits: {
    dailyRuns: number;
    dailyCostBudgetUsd: number;
    runsPerMinute: number;
  };
};

export type RunHistoryPage = {
  items: readonly Omit<RunRecord, 'output'>[];
  nextBefore?: string;
};

type ApiEnvelope<T> = {
  ok: true;
  data: T;
  pagination?: {
    nextBefore?: string | null;
  };
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};

export class AiApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = 'AiApiError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}

export class AiApiClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof globalThis.fetch;

  constructor(options: AiApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '').replace(/\/+$/, '');
    this.fetchImplementation =
      options.fetchImplementation ?? globalThis.fetch.bind(globalThis);
  }

  capabilities(): Promise<AiCapabilityStatus> {
    return this.getJson('/api/V1/ai/capabilities');
  }

  providers(): Promise<unknown> {
    return this.getJson('/api/V1/ai/providers');
  }

  models(): Promise<readonly AiModelSummary[]> {
    return this.getJson('/api/V1/ai/models');
  }

  tools(): Promise<readonly AiToolDefinition[]> {
    return this.getJson('/api/V1/ai/tools');
  }

  usage(): Promise<AiUsageSummary> {
    return this.getJson('/api/V1/ai/usage');
  }

  async listRuns(options: {
    limit?: number;
    before?: string;
  } = {}): Promise<RunHistoryPage> {
    const query = new URLSearchParams();

    if (options.limit !== undefined) {
      query.set('limit', String(options.limit));
    }

    if (options.before !== undefined) {
      query.set('before', options.before);
    }

    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const envelope = await this.requestEnvelope<
      readonly Omit<RunRecord, 'output'>[]
    >(`/api/V1/ai/runs${suffix}`);

    return {
      items: envelope.data,
      ...(envelope.pagination?.nextBefore
        ? { nextBefore: envelope.pagination.nextBefore }
        : {}),
    };
  }

  getRun(runId: string): Promise<RunRecord> {
    return this.getJson(
      `/api/V1/ai/runs/${encodeURIComponent(runId)}`,
    );
  }

  createRun(
    request: OrchestrationRequest,
    options: {
      idempotencyKey?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<RunRecord> {
    const headers = new Headers({
      'content-type': 'application/json',
    });

    if (options.idempotencyKey) {
      headers.set('idempotency-key', options.idempotencyKey);
    }

    return this.getJson('/api/V1/ai/runs', {
      method: 'POST',
      headers,
      body: JSON.stringify(stripTrustedIdentity(request)),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  }

  cancelRun(runId: string): Promise<RunRecord> {
    return this.getJson(
      `/api/V1/ai/runs/${encodeURIComponent(runId)}`,
      { method: 'DELETE' },
    );
  }

  async runEvents(
    runId: string,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await this.fetchImplementation(
      this.url(
        `/api/V1/ai/runs/${encodeURIComponent(runId)}/events`,
      ),
      {
        headers: {
          accept: 'text/event-stream',
        },
        credentials: 'include',
        ...(signal ? { signal } : {}),
      },
    );

    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }

    if (!response.body) {
      throw new AiApiError('The run event stream has no response body.', {
        status: response.status,
      });
    }

    return response.body;
  }

  async getArtifact(
    artifactId: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    const response = await this.fetchImplementation(
      this.artifactUrl(artifactId),
      {
        credentials: 'include',
        ...(signal ? { signal } : {}),
      },
    );

    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }

    return response;
  }

  async deleteArtifact(artifactId: string): Promise<void> {
    const response = await this.fetchImplementation(
      this.artifactUrl(artifactId),
      {
        method: 'DELETE',
        credentials: 'include',
      },
    );

    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }
  }

  artifactUrl(artifactId: string): string {
    return this.url(
      `/api/V1/ai/artifacts/${encodeURIComponent(artifactId)}`,
    );
  }

  private async getJson<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const envelope = await this.requestEnvelope<T>(path, init);
    return envelope.data;
  }

  private async requestEnvelope<T>(
    path: string,
    init?: RequestInit,
  ): Promise<ApiEnvelope<T>> {
    const response = await this.fetchImplementation(this.url(path), {
      ...init,
      credentials: init?.credentials ?? 'include',
    });

    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }

    return (await response.json()) as ApiEnvelope<T>;
  }

  private async errorFromResponse(
    response: Response,
  ): Promise<AiApiError> {
    const body = (await response.json().catch(() => undefined)) as
      | ApiErrorEnvelope
      | undefined;
    const error = body?.error;

    return new AiApiError(
      error?.message ?? `AI API request failed with HTTP ${response.status}.`,
      {
        status: response.status,
        ...(error?.code ? { code: error.code } : {}),
        ...(error?.requestId ? { requestId: error.requestId } : {}),
      },
    );
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }
}

function stripTrustedIdentity(
  request: OrchestrationRequest,
): OrchestrationRequest {
  const {
    tenantId,
    actorId,
    ...safeRequest
  } = request;
  void tenantId;
  void actorId;

  return safeRequest;
}
