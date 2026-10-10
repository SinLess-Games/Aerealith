import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  download,
  isAccessDenied,
  isSourceFailure,
  parseYaml,
  removeCatalogSource,
} from './download-data';
import { writeFile } from 'node:fs/promises';

test('pruning removes only the failed YAML source and archives it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-prune-test-'));
  const path = join(root, 'sources.yaml');
  const archive = join(root, 'removed.jsonl');
  const entry = (id: string) =>
    `  - id: ${id}\n    url: https://example.com/${id}\n    filename: ${id}.txt\n    category: test\n    license: test\n    licenseUrl: https://example.com/license\n`;
  try {
    await writeFile(
      path,
      '# Catalog\nsources:\n' + entry('broken') + entry('working'),
    );
    await removeCatalogSource(path, 'broken', archive);
    const remaining = await readFile(path, 'utf8');
    assert.match(remaining, /# Catalog/);
    assert.deepEqual(
      parseYaml(remaining).map((source) => (source as { id: string }).id),
      ['working'],
    );
    assert.equal(
      JSON.parse(await readFile(archive, 'utf8')).source.id,
      'broken',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('pruning handles JSON catalogs and distinguishes disk failures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-prune-json-'));
  try {
    const source = {
      id: 'broken',
      url: 'https://example.com/data',
      filename: 'test.txt',
      category: 'test',
      license: 'test',
      licenseUrl: 'https://example.com/license',
    };
    const path = join(root, 'sources.json');
    await writeFile(
      path,
      JSON.stringify({ sources: [source], description: 'keep' }),
    );
    await removeCatalogSource(path, 'broken', join(root, 'removed.jsonl'));
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {
      sources: [],
      description: 'keep',
    });
    assert.equal(
      isSourceFailure(Object.assign(Error('HTTP 404'), { status: 404 })),
      true,
    );
    assert.equal(isSourceFailure(Error('fetch failed')), true);
    assert.equal(isSourceFailure(Error('SHA-256 mismatch')), true);
    assert.equal(
      isSourceFailure(Object.assign(Error('Disk full'), { code: 'ENOSPC' })),
      false,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('only publisher access denials qualify as unavailable', () => {
  assert.equal(isAccessDenied({ status: 401 }), true);
  assert.equal(isAccessDenied({ status: 403 }), true);
  for (const error of [
    { status: 404 },
    { status: 500 },
    Error('fetch failed'),
    null,
  ]) {
    assert.equal(isAccessDenied(error), false);
  }
});

test('download preserves access status for the pipeline policy', async () => {
  const root = await mkdtemp(join(tmpdir(), 'aerealith-access-test-'));
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      const response = new Response('', { status: 401 });
      Object.defineProperty(response, 'url', {
        value: 'https://example.com/data',
      });
      return response;
    };
    await assert.rejects(
      download(
        {
          id: 'test',
          url: 'https://example.com/data',
          filename: 'test.txt',
          category: 'test',
          license: 'test',
          licenseUrl: 'https://example.com/license',
        },
        join(root, 'test.txt'),
        100,
        1000,
        0,
        join(root, 'manifest'),
      ),
      isAccessDenied,
    );
  } finally {
    globalThis.fetch = originalFetch;
    await rm(root, { recursive: true, force: true });
  }
});

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
