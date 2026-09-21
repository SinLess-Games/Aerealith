import { R2ArtifactStore } from './r2-artifact-store';

describe('R2ArtifactStore', () => {
  it('stores artifacts under hashed tenant namespaces', async () => {
    const put = vi.fn(
      async (
        _key: string,
        value: ArrayBuffer | ReadableStream,
        _options?: unknown,
      ) => ({
        uploaded: new Date('2026-09-21T00:00:00.000Z'),
        size: value instanceof ArrayBuffer ? value.byteLength : 0,
      }),
    );
    const bucket = {
      put,
    } as unknown as R2Bucket;
    const store = new R2ArtifactStore(bucket);
    const body = new TextEncoder().encode('hello').buffer;

    const reference = await store.put('user:user-123', {
      kind: 'file',
      contentType: 'text/plain',
      body,
      metadata: { purpose: 'test' },
    });

    expect(reference).toMatchObject({
      kind: 'file',
      contentType: 'text/plain',
      sizeBytes: 5,
      metadata: { purpose: 'test' },
    });

    const [key] = put.mock.calls[0] ?? [];
    expect(key).toMatch(
      /^AI\/artifacts\/[0-9a-f]{64}\/[0-9a-f-]{36}$/,
    );
    expect(key).not.toContain('user-123');
  });

  it('returns private non-cacheable artifact responses', async () => {
    const get = vi.fn(async () => ({
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('artifact'));
          controller.close();
        },
      }),
      size: 8,
      httpEtag: '"etag"',
      writeHttpMetadata(headers: Headers) {
        headers.set('content-type', 'text/plain');
      },
    }));
    const bucket = {
      get,
    } as unknown as R2Bucket;
    const store = new R2ArtifactStore(bucket);

    const response = await store.get(
      'user:user-123',
      '5d9dd628-c0a3-4fb7-a03d-2a345278ebd5',
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get('content-type')).toBe('text/plain');
    expect(response?.headers.get('cache-control')).toBe('private, no-store');
    expect(response?.headers.get('etag')).toBe('"etag"');
    await expect(response?.text()).resolves.toBe('artifact');
  });

  it('rejects malformed artifact ids before touching R2', async () => {
    const get = vi.fn();
    const bucket = { get } as unknown as R2Bucket;
    const store = new R2ArtifactStore(bucket);

    await expect(
      store.get('user:user-123', '../other-user/object'),
    ).rejects.toThrow('Artifact id must be a UUID');

    expect(get).not.toHaveBeenCalled();
  });
});
