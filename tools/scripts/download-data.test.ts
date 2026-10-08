import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { download, parseYaml } from './download-data';

test('catalog parser rejects duplicate and unsupported properties', () => {
  assert.deepEqual(parseYaml('sources:\n  - id: sample\n    enabled: true'), [
    { id: 'sample', enabled: true },
  ]);
  assert.throws(
    () => parseYaml('sources:\n  - id: a\n    id: b'),
    /Invalid YAML key/,
  );
  assert.throws(
    () => parseYaml('sources:\n  - unexpected: a'),
    /Invalid YAML key/,
  );
});

test('resumes partial bytes and records completed provenance', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-download-test-'));
  const target = join(root, 'sample.txt');
  const manifest = join(root, 'manifest.jsonl');
  const source = {
    id: 'sample',
    url: 'https://example.com/sample.txt',
    filename: 'sample.txt',
    category: 'test',
    license: 'test',
    licenseUrl: 'https://example.com/license',
  };
  const originalFetch = globalThis.fetch;
  try {
    await writeFile(`${target}.part`, 'abc');
    await writeFile(
      `${target}.part.json`,
      JSON.stringify({ url: source.url, etag: 'original' }),
    );
    globalThis.fetch = async (_url, init) => {
      assert.equal((init?.headers as Record<string, string>).Range, 'bytes=3-');
      assert.equal(
        (init?.headers as Record<string, string>)['If-Range'],
        'original',
      );
      const response = new Response('def', {
        status: 206,
        headers: { 'content-range': 'bytes 3-5/6', 'content-length': '3' },
      });
      Object.defineProperty(response, 'url', { value: source.url });
      return response;
    };
    await download(source, target, 100, 1000, 0, manifest);
    assert.equal(await readFile(target, 'utf8'), 'abcdef');
    const entry = JSON.parse(await readFile(manifest, 'utf8'));
    assert.equal(entry.bytes, 6);
    assert.equal(entry.sha256.length, 64);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(root, { recursive: true, force: true });
  }
});

test('size limit prevents publishing oversized files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-download-test-'));
  const originalFetch = globalThis.fetch;
  const source = {
    id: 'sample',
    url: 'https://example.com/sample.txt',
    filename: 'sample.txt',
    category: 'test',
    license: 'test',
    licenseUrl: 'https://example.com/license',
  };
  try {
    globalThis.fetch = async () => {
      const response = new Response('abcdef', {
        headers: { 'content-length': '6' },
      });
      Object.defineProperty(response, 'url', { value: source.url });
      return response;
    };
    await assert.rejects(
      download(
        source,
        join(root, 'sample.txt'),
        3,
        1000,
        0,
        join(root, 'manifest'),
      ),
      /exceeds max-mb/,
    );
    await assert.rejects(readFile(join(root, 'sample.txt')), /ENOENT/);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(root, { recursive: true, force: true });
  }
});
