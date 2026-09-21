import type {
  ArtifactReference,
  ArtifactStore,
  ArtifactWrite,
} from '@aerealith-ai/ai-orchestration';

const ARTIFACT_PREFIX = 'AI/artifacts';
const MAX_CUSTOM_METADATA_BYTES = 8 * 1024;

export class R2ArtifactStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'R2ArtifactStoreError';
  }
}

export class R2ArtifactStore implements ArtifactStore {
  constructor(private readonly bucket: R2Bucket) {}

  async put(
    namespace: string,
    artifact: ArtifactWrite,
  ): Promise<ArtifactReference> {
    const artifactId = crypto.randomUUID();
    const key = await artifactKey(namespace, artifactId);
    const metadataJson = JSON.stringify(artifact.metadata ?? {});

    if (
      new TextEncoder().encode(metadataJson).byteLength >
      MAX_CUSTOM_METADATA_BYTES
    ) {
      throw new R2ArtifactStoreError(
        'Artifact metadata exceeds the 8 KiB storage limit.',
      );
    }

    const object = await this.bucket.put(key, artifact.body, {
      httpMetadata: {
        contentType: artifact.contentType,
      },
      customMetadata: {
        aerealith_artifact_id: artifactId,
        aerealith_artifact_kind: artifact.kind,
        aerealith_metadata: metadataJson,
      },
    });

    if (!object) {
      throw new R2ArtifactStoreError('R2 did not return an artifact object.');
    }

    return {
      id: artifactId,
      kind: artifact.kind,
      contentType: artifact.contentType,
      createdAt: object.uploaded.toISOString(),
      sizeBytes: object.size,
      ...(artifact.body instanceof ArrayBuffer
        ? { checksum: await sha256Hex(artifact.body) }
        : {}),
      ...(artifact.metadata ? { metadata: artifact.metadata } : {}),
    };
  }

  async get(
    namespace: string,
    artifactId: string,
  ): Promise<Response | undefined> {
    validateArtifactId(artifactId);
    const object = await this.bucket.get(
      await artifactKey(namespace, artifactId),
    );

    if (!object) return undefined;

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('content-length', object.size.toString());
    headers.set('cache-control', 'private, no-store');

    return new Response(object.body, {
      status: 200,
      headers,
    });
  }

  async delete(namespace: string, artifactId: string): Promise<void> {
    validateArtifactId(artifactId);
    await this.bucket.delete(await artifactKey(namespace, artifactId));
  }
}

async function artifactKey(
  namespace: string,
  artifactId: string,
): Promise<string> {
  const normalizedNamespace = namespace.trim();

  if (!normalizedNamespace) {
    throw new R2ArtifactStoreError('An artifact namespace is required.');
  }

  validateArtifactId(artifactId);

  const namespaceHash = await sha256Hex(
    new TextEncoder().encode(normalizedNamespace).buffer,
  );

  return `${ARTIFACT_PREFIX}/${namespaceHash}/${artifactId}`;
}

function validateArtifactId(artifactId: string): void {
  if (!/^[0-9a-f-]{36}$/i.test(artifactId)) {
    throw new R2ArtifactStoreError('Artifact id must be a UUID.');
  }
}

async function sha256Hex(value: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', value),
  );

  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
