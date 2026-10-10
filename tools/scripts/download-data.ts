/** Aerealith Core resumable dataset downloader. Node 22+, no runtime dependencies. */
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import {
  appendFile,
  mkdir,
  open,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

type Source = {
  id: string;
  url: string;
  filename: string;
  category: string;
  license: string;
  licenseUrl: string;
  enabled?: boolean;
  sha256?: string;
  notes?: string;
};
const args = process.argv.slice(2).flatMap((arg) => {
  if (!arg.startsWith('--') || !arg.includes('=')) return [arg];
  const i = arg.indexOf('=');
  const key = arg.slice(0, i),
    value = arg.slice(i + 1);
  return value === 'true' ? [key] : value === 'false' ? [] : [key, value];
});
const values = (flag: string) =>
  args.flatMap((a, i) => (a === flag ? [args[i + 1] ?? ''] : []));
const opt = (flag: string, fallback: string) => values(flag).at(-1) ?? fallback;
const has = (flag: string) => args.includes(flag);
async function huggingFaceToken(): Promise<string | undefined> {
  const environment =
    process.env.HF_TOKEN ?? process.env.HUGGING_FACE_HUB_TOKEN;
  if (environment) return environment;
  const path =
    process.env.HF_TOKEN_PATH ??
    join(
      process.env.HF_HOME ?? join(homedir(), '.cache', 'huggingface'),
      'token',
    );
  return readFile(path, 'utf8')
    .then((value) => value.trim() || undefined)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined;
      throw Error(
        'Cannot read Hugging Face token file; check HF_TOKEN_PATH permissions',
      );
    });
}
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ext = (name: string) => {
  const e = extname(name).slice(1).toLowerCase();
  if (!/^[a-z0-9]{1,12}$/.test(e)) throw Error(`Invalid extension: ${name}`);
  return e;
};
export function parseYaml(text: string): unknown[] {
  const out: Record<string, unknown>[] = [];
  let current: Record<string, unknown> | undefined;
  let root = false;
  const allowed = new Set([
    'id',
    'url',
    'filename',
    'category',
    'license',
    'licenseUrl',
    'enabled',
    'sha256',
    'notes',
  ]);
  for (const [i, line] of text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .entries()) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    if (!root && line.trim() === 'sources:') {
      root = true;
      continue;
    }
    if (!root) throw Error(`Expected sources: at line ${i + 1}`);
    const start = line.match(/^ {2}- (\w+):\s*(.*)$/);
    const prop = line.match(/^ {4}(\w+):\s*(.*)$/);
    if (start) {
      current = {};
      out.push(current);
    } else if (!prop || !current) throw Error(`Unsupported YAML line ${i + 1}`);
    const match = start ?? prop;
    if (!match || !current) throw Error(`Unsupported YAML line ${i + 1}`);
    const [, key, raw] = match;
    if (!allowed.has(key) || Object.hasOwn(current, key))
      throw Error(`Invalid YAML key ${key} at line ${i + 1}`);
    let value: unknown = raw.trim();
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (typeof value === 'string' && value.startsWith('"'))
      value = JSON.parse(value);
    else if (
      typeof value === 'string' &&
      value.startsWith("'") &&
      value.endsWith("'")
    )
      value = value.slice(1, -1).replace(/''/g, "'");
    current[key] = value;
  }
  if (!out.length) throw Error('Empty catalog');
  return out;
}
async function catalog(path: string): Promise<Source[]> {
  const content = await readFile(path, 'utf8');
  const parsed = path.endsWith('.json')
    ? JSON.parse(content)
    : parseYaml(content);
  const rows = Array.isArray(parsed) ? parsed : parsed?.sources;
  if (!Array.isArray(rows)) throw Error('Catalog requires a sources array');
  const ids = new Set<string>(),
    paths = new Set<string>();
  return rows.map((s: Source) => {
    if (!s || typeof s !== 'object') throw Error('Invalid source');
    for (const k of [
      'id',
      'url',
      'filename',
      'category',
      'license',
      'licenseUrl',
    ] as const)
      if (typeof s[k] !== 'string' || !s[k]) throw Error(`Missing ${k}`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id)) throw Error(`Invalid ID ${s.id}`);
    if (
      s.filename !== basename(s.filename) ||
      /[\\/]/.test(s.filename) ||
      [...s.filename].some((c) => c.charCodeAt(0) < 32) ||
      s.filename === '..'
    )
      throw Error(`Unsafe filename ${s.filename}`);
    if (
      new URL(s.url).protocol !== 'https:' ||
      new URL(s.licenseUrl).protocol !== 'https:'
    )
      throw Error(`HTTPS required for ${s.id}`);
    if (s.sha256 && !/^[a-f0-9]{64}$/i.test(s.sha256))
      throw Error(`Invalid checksum ${s.id}`);
    const p = `${ext(s.filename)}/${s.filename}`;
    if (ids.has(s.id) || paths.has(p)) throw Error(`Duplicate source ${s.id}`);
    ids.add(s.id);
    paths.add(p);
    return s;
  });
}
async function hashFile(path: string) {
  const h = createHash('sha256');
  const f = await open(path, 'r');
  try {
    for await (const chunk of f.createReadStream()) h.update(chunk);
  } finally {
    await f.close();
  }
  return h.digest('hex');
}
const retryable = (status: number) =>
  [408, 425, 429, 500, 502, 503, 504].includes(status);
const backoff = (attempt: number) =>
  Math.min(30000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 500);
async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  method = 'GET',
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}
export async function removeCatalogSource(
  path: string,
  id: string,
  archive: string,
): Promise<void> {
  const original = await readFile(path, 'utf8');
  const sources = await catalog(path);
  const removed = sources.find((source) => source.id === id);
  if (!removed) return;
  let replacement: string;
  if (path.endsWith('.json')) {
    const parsed = JSON.parse(original);
    const remaining = sources.filter((source) => source.id !== id);
    replacement =
      JSON.stringify(
        Array.isArray(parsed) ? remaining : { ...parsed, sources: remaining },
        null,
        2,
      ) + '\n';
  } else {
    const blocks = original.split(/(?=^ {2}- \w+:)/m);
    replacement = blocks
      .filter(
        (block) =>
          !block.startsWith('  - ') ||
          (parseYaml('sources:\n' + block)[0] as Source).id !== id,
      )
      .join('');
  }
  await mkdir(dirname(archive), { recursive: true });
  await appendFile(
    archive,
    JSON.stringify({ removedAt: new Date().toISOString(), source: removed }) +
      '\n',
  );
  const temporary = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, replacement);
    if ((await readFile(path, 'utf8')) !== original)
      throw Error('Catalog changed while pruning; retry to preserve edits');
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
}

export function isSourceFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    typeof (error as Error & { status?: number }).status === 'number' ||
    ['AbortError', 'TimeoutError'].includes(error.name) ||
    /fetch failed|terminated|Stream stalled|checksum mismatch|SHA-256 mismatch|Incomplete response|HTTP 416/i.test(
      error.message,
    )
  );
}

export function isAccessDenied(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

export async function download(
  source: Source,
  target: string,
  maxBytes: number,
  timeoutMs: number,
  retries: number,
  manifest: string,
): Promise<void> {
  const existing = await stat(target).catch(() => null);
  if (existing) {
    if (!existing.isFile()) throw Error('Destination is not a regular file');
    const checksum = await hashFile(target);
    if (source.sha256 && checksum.toLowerCase() !== source.sha256.toLowerCase())
      throw Error('Existing checksum mismatch');
    console.log(`  exists: ${existing.size} bytes; sha256 ${checksum}`);
    return;
  }
  const partial = `${target}.part`;
  const meta = `${partial}.json`;
  let saved = await readFile(meta, 'utf8')
    .then(
      (v) =>
        JSON.parse(v) as { url: string; etag?: string; lastModified?: string },
    )
    .catch(() => null);
  if (saved && saved.url !== source.url)
    throw Error('Partial belongs to different URL; remove manually');
  let last: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const size = (await stat(partial).catch(() => null))?.size ?? 0;
      if (size > maxBytes) throw Error('Existing partial exceeds size limit');
      const headers: Record<string, string> = {
        'User-Agent': 'AerealithCoreDatasetDownloader/2.0',
        'Accept-Encoding': 'identity',
      };
      const token = await huggingFaceToken();
      if (token && new URL(source.url).hostname === 'huggingface.co')
        headers.Authorization = `Bearer ${token}`;
      if (size) {
        headers.Range = `bytes=${size}-`;
        if (saved?.etag) headers['If-Range'] = saved.etag;
        else if (saved?.lastModified) headers['If-Range'] = saved.lastModified;
      }
      // Timeout covers establishing the response; stalled streaming is detected separately.
      const response = await fetchWithTimeout(source.url, headers, timeoutMs);
      if (new URL(response.url).protocol !== 'https:')
        throw Error('Insecure redirect');
      if (response.status === 416 && size) {
        console.log('  range rejected; checking existing partial');
        throw Error('HTTP 416: partial size does not match remote file');
      }
      if (!response.ok || !response.body) {
        const e = Error(
          `HTTP ${response.status} ${response.status === 401 ? '(check dataset access / HF_TOKEN)' : ''}`,
        );
        if (retryable(response.status)) throw e;
        throw Object.assign(e, { permanent: true, status: response.status });
      }
      const append = size > 0 && response.status === 206;
      if (size && !append)
        console.log('  server did not honor resume; restarting partial safely');
      const range = response.headers.get('content-range');
      if (append && (!range || !range.startsWith(`bytes ${size}-`)))
        throw Error(`Invalid Content-Range: ${range}`);
      const length = response.headers.get('content-length');
      const expected = length === null ? null : Number(length);
      if (
        expected !== null &&
        (!Number.isSafeInteger(expected) ||
          expected < 0 ||
          (append ? size : 0) + expected > maxBytes)
      )
        throw Object.assign(Error('Download exceeds max-mb'), {
          permanent: true,
        });
      saved = {
        url: source.url,
        etag: response.headers.get('etag') ?? undefined,
        lastModified: response.headers.get('last-modified') ?? undefined,
      };
      await writeFile(meta, JSON.stringify(saved));
      let bytes = append ? size : 0;
      let lastProgress = Date.now();
      const input = Readable.fromWeb(
        response.body as Parameters<typeof Readable.fromWeb>[0],
      );
      // A stalled stream is interrupted; existing partial bytes remain intact.
      let stall: ReturnType<typeof setTimeout> | undefined;
      const reset = () => {
        if (stall) clearTimeout(stall);
        stall = setTimeout(
          () => input.destroy(Error('Stream stalled')),
          timeoutMs,
        );
      };
      async function* bounded() {
        reset();
        try {
          for await (const chunk of input) {
            reset();
            bytes += chunk.length;
            if (Date.now() - lastProgress >= 10000) {
              console.log(
                `  progress: ${(bytes / 1048576).toFixed(1)} MiB${expected === null ? '' : ` / ${(((append ? size : 0) + expected) / 1048576).toFixed(1)} MiB`}`,
              );
              lastProgress = Date.now();
            }
            if (bytes > maxBytes)
              throw Object.assign(Error('Download exceeded max-mb'), {
                permanent: true,
              });
            yield chunk;
          }
        } finally {
          if (stall) clearTimeout(stall);
        }
      }
      await pipeline(
        Readable.from(bounded()),
        createWriteStream(partial, { flags: append ? 'a' : 'w' }),
      );
      if (expected !== null && bytes - (append ? size : 0) !== expected)
        throw Error('Incomplete response');
      const checksum = await hashFile(partial);
      if (
        source.sha256 &&
        checksum.toLowerCase() !== source.sha256.toLowerCase()
      )
        throw Object.assign(
          Error('SHA-256 mismatch; partial retained for inspection'),
          { permanent: true },
        );
      await rename(partial, target);
      await rm(meta, { force: true });
      await appendFile(
        manifest,
        JSON.stringify({
          ...source,
          downloadedAt: new Date().toISOString(),
          bytes,
          sha256: checksum,
          path: target,
        }) + '\n',
      );
      console.log(`  complete: ${bytes} bytes; sha256 ${checksum}`);
      return;
    } catch (e) {
      last = e;
      const permanent = Boolean((e as { permanent?: boolean })?.permanent);
      if (permanent || attempt === retries) break;
      const delay = backoff(attempt);
      console.warn(
        `  retry ${attempt + 1}/${retries} in ${Math.round(delay / 1000)}s: ${String(e)}`,
      );
      await wait(delay);
    }
  }
  throw last;
}
async function main() {
  if (has('--help')) {
    console.log(
      '--list --check --keep-failed --skip-unavailable --all --id ID --category NAME --include-disabled --dry-run --accept-licenses --catalog PATH --root PATH --max-mb N --timeout-ms N --retries N',
    );
    return;
  }
  for (const flag of [
    '--id',
    '--category',
    '--catalog',
    '--root',
    '--max-mb',
    '--timeout-ms',
    '--retries',
  ])
    for (const v of values(flag))
      if (!v || v.startsWith('--')) throw Error(`Missing value for ${flag}`);
  const root = resolve(
    opt(
      '--root',
      process.env.AEREALITH_DATA_ROOT ?? join(process.cwd(), 'data'),
    ),
  );
  const catalogPath = resolve(
    opt('--catalog', 'tools/scripts/config/data-sources.yaml'),
  );
  const sources = await catalog(catalogPath);
  if (has('--list')) {
    for (const s of sources)
      console.log(
        `${s.enabled === false ? 'disabled' : 'enabled'}\t${s.id}\t${s.category}\t${s.url}`,
      );
    return;
  }
  const ids = values('--id'),
    categories = values('--category');
  if (!has('--all') && !ids.length && !categories.length)
    throw Error('Specify --all, --id or --category');
  for (const id of ids)
    if (!sources.some((s) => s.id === id)) throw Error(`Unknown ID: ${id}`);
  const selected = sources.filter(
    (s) =>
      (has('--include-disabled') || s.enabled !== false) &&
      (has('--all') || ids.includes(s.id) || categories.includes(s.category)),
  );
  if (!selected.length) throw Error('No matching sources');
  const dry = has('--dry-run'),
    check = has('--check');
  if (!dry && !check && !has('--accept-licenses'))
    throw Error('Review source terms and pass --accept-licenses');
  const maxMb = Number(opt('--max-mb', '102400')),
    timeoutMs = Number(opt('--timeout-ms', '120000')),
    retries = Number(opt('--retries', '4'));
  if (
    !Number.isFinite(maxMb) ||
    maxMb <= 0 ||
    !Number.isSafeInteger(retries) ||
    retries < 0 ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 1000
  )
    throw Error('Invalid numeric options');
  const maxBytes = Math.floor(maxMb * 1048576),
    manifest = join(root, 'manifests', 'downloads.jsonl');
  if (!dry && !check) await mkdir(join(root, 'manifests'), { recursive: true });
  let failures = 0;
  const unavailable: string[] = [];
  const removed: string[] = [];
  for (const s of selected) {
    const target = join(root, 'raw', ext(s.filename), s.filename);
    console.log(
      `${dry ? '[dry-run]' : check ? '[check]' : '[download]'} ${s.id} -> ${target}`,
    );
    if (dry) continue;
    try {
      if (check) {
        const headers: Record<string, string> = {
          'Accept-Encoding': 'identity',
        };
        const token = await huggingFaceToken();
        if (token && new URL(s.url).hostname === 'huggingface.co')
          headers.Authorization = `Bearer ${token}`;
        const response = await fetchWithTimeout(
          s.url,
          headers,
          timeoutMs,
          'HEAD',
        );
        if (!response.ok)
          throw Object.assign(
            Error(
              `HTTP ${response.status}${[401, 403].includes(response.status) ? ' — access denied; check publisher access and HF_TOKEN' : ''}`,
            ),
            { status: response.status },
          );
        const length = response.headers.get('content-length');
        console.log(`  available: ${length ?? 'unknown'} bytes`);
        if (length && Number(length) > maxBytes)
          throw Error('Remote file exceeds max-mb');
        continue;
      }
      await mkdir(join(root, 'raw', ext(s.filename)), { recursive: true });
      await download(s, target, maxBytes, timeoutMs, retries, manifest);
    } catch (e) {
      if (!check && !has('--keep-failed') && isSourceFailure(e)) {
        // A completed file with a checksum failure must not reach processing.
        if ((await stat(target).catch(() => null))?.isFile()) {
          const quarantine = join(root, 'quarantine', s.id);
          await mkdir(quarantine, { recursive: true });
          await rename(
            target,
            join(quarantine, `${Date.now()}-${basename(target)}`),
          );
        }
        await removeCatalogSource(
          catalogPath,
          s.id,
          join(root, 'manifests', 'removed-sources.jsonl'),
        );
        removed.push(s.id);
        console.warn(
          `  REMOVED ${s.id} from catalog: ${String(e)}; continuing`,
        );
        continue;
      }
      if (has('--skip-unavailable') && isAccessDenied(e)) {
        unavailable.push(s.id);
        console.warn(
          `  UNAVAILABLE ${s.id}: ${String(e)}; continuing with accessible sources`,
        );
        continue;
      }
      failures++;
      console.error(
        `  FAILED ${s.id}: ${String(e)}${(e as Error & { cause?: Error })?.cause ? `; cause: ${String((e as Error & { cause?: Error }).cause)}` : ''}`,
      );
    }
  }
  console.log(
    `Finished: ${selected.length - failures - unavailable.length - removed.length}/${selected.length} successful or existing; ${unavailable.length} unavailable; ${removed.length} removed; ${failures} failed`,
  );
  if (!dry && !check) {
    const report = join(root, 'manifests', 'download-report.json');
    await writeFile(
      `${report}.tmp`,
      JSON.stringify(
        {
          completedAt: new Date().toISOString(),
          selected: selected.length,
          successful:
            selected.length - failures - unavailable.length - removed.length,
          removed,
          unavailable,
          failures,
        },
        null,
        2,
      ) + '\n',
    );
    await rename(`${report}.tmp`, report);
  }
  if (failures || unavailable.length + removed.length === selected.length)
    process.exitCode = 1;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
