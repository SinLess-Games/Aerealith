// scripts/generate-sitemap.ts

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE_URL = 'https://aerealith.com';

const PROJECT_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ROUTES_DIRECTORY = resolve(PROJECT_ROOT, 'apps/frontend/src/app/routes');

const DEFAULT_OUTPUT_DIRECTORY = resolve(PROJECT_ROOT, 'dist/apps/frontend');

const ROUTE_FILE_SUFFIXES = [
  '.route.tsx',
  '.route.ts',
  '.route.jsx',
  '.route.js',
];

/**
 * Route modules that represent dynamic, private, non-public, or non-page
 * routes. These must not appear in a static XML sitemap.
 */
const EXCLUDED_FILE_NAMES = new Set([
  '[error].route.tsx',
  '[error].route.ts',
  '[error].route.jsx',
  '[error].route.js',
  'home.route.tsx',
  'home.route.ts',
  'home.route.jsx',
  'home.route.js',
  'layout.route.tsx',
  'layout.route.ts',
  'layout.route.jsx',
  'layout.route.js',
  'index.route.tsx',
  'index.route.ts',
  'index.route.jsx',
  'index.route.js',
]);

/**
 * Directory names that are implementation groups, not URL segments.
 *
 * Example:
 *   routes/marketing-site/about.route.tsx -> /about
 *   routes/docs-sites/docs.user.route.tsx -> /docs/user
 */
const PATHLESS_DIRECTORY_NAMES = new Set(['marketing-site', 'docs-sites']);

/**
 * Route segments/prefixes that must never be placed into the static public
 * sitemap. The names mirror application-only paths protected in robots.txt.
 */
const EXCLUDED_PATH_PREFIXES = [
  '/admin',
  '/account',
  '/api',
  '/auth',
  '/billing',
  '/dashboard',
  '/internal',
  '/login',
  '/register',
  '/settings',
];

/**
 * Optional, narrowly scoped route aliases for filenames that do not map
 * directly to their URL structure.
 *
 * This is intentionally not a full route manifest. Only add aliases where a
 * source filename cannot express its own final public URL.
 *
 * Examples:
 *   docs.developer.route.tsx -> /docs/developer
 *   docs.user.route.tsx -> /docs/user
 */
const ROUTE_ALIASES: Readonly<Record<string, string>> = {
  'docs-sites/docs.developer.route.tsx': '/docs/developer',
  'docs-sites/docs.user.route.tsx': '/docs/user',
  'marketing-site/home.route.tsx': '/',
};

/**
 * A public route may have a valid component but should not be indexed yet.
 *
 * Keep illustrative/non-live pricing out of the sitemap while the page is
 * intentionally noindexed. Delete this entry when pricing becomes final,
 * purchasable, and intentionally indexable.
 */
const EXCLUDED_PUBLIC_PATHS = new Set(['/pricing']);

type SitemapRoute = {
  path: string;
  sourceFile: string;
};

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normalizePath(value: string): string {
  const path = value.trim();

  if (!path || path === '/') {
    return '/';
  }

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlashes = withLeadingSlash.replace(/\/+$/, '');

  return withoutTrailingSlashes || '/';
}

function toAbsoluteUrl(path: string): string {
  return new URL(normalizePath(path), SITE_URL).toString();
}

function isRouteModule(fileName: string): boolean {
  return ROUTE_FILE_SUFFIXES.some((suffix) => fileName.endsWith(suffix));
}

function isDynamicSegment(segment: string): boolean {
  return (
    segment.startsWith('[') ||
    segment.startsWith(':') ||
    segment.startsWith('$') ||
    segment.includes('*')
  );
}

function isExcludedPath(path: string): boolean {
  const normalizedPath = normalizePath(path);

  if (EXCLUDED_PUBLIC_PATHS.has(normalizedPath)) {
    return true;
  }

  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

function stripRouteExtension(fileName: string): string {
  const suffix = ROUTE_FILE_SUFFIXES.find((candidate) =>
    fileName.endsWith(candidate),
  );

  if (!suffix) {
    throw new Error(`Unsupported route file: ${fileName}`);
  }

  return fileName.slice(0, -suffix.length);
}

/**
 * Converts a source route file into a URL path.
 *
 * Examples:
 *   marketing-site/home.route.tsx              -> /
 *   marketing-site/about.route.tsx             -> /about
 *   marketing-site/policy.route.tsx            -> excluded (dynamic :slug)
 *   docs-sites/docs.developer.route.tsx        -> /docs/developer
 *   nested/team/contact.route.tsx              -> /nested/team/contact
 */
export function routeFileToPath(
  absoluteFilePath: string,
  routesDirectory = ROUTES_DIRECTORY,
): string | undefined {
  const sourceFile = relative(routesDirectory, absoluteFilePath);
  const normalizedSourceFile = sourceFile.split(sep).join('/');

  const alias = ROUTE_ALIASES[normalizedSourceFile];

  if (alias) {
    return normalizePath(alias);
  }

  const fileName = basename(absoluteFilePath);

  if (EXCLUDED_FILE_NAMES.has(fileName)) {
    return undefined;
  }

  const relativeSegments = normalizedSourceFile.split('/');
  const fileSegment = stripRouteExtension(relativeSegments.pop() ?? '');

  const pathSegments = [
    ...relativeSegments.filter(
      (segment) => !PATHLESS_DIRECTORY_NAMES.has(segment),
    ),
    fileSegment,
  ]
    .flatMap((segment) => segment.split('.'))
    .filter(Boolean)
    .filter((segment) => segment !== 'index' && segment !== 'home');

  if (pathSegments.some(isDynamicSegment)) {
    return undefined;
  }

  if (pathSegments.length === 0) {
    return '/';
  }

  return normalizePath(`/${pathSegments.join('/')}`);
}

async function findRouteFiles(
  directory: string,
  foundFiles: string[] = [],
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        await findRouteFiles(entryPath, foundFiles);
        return;
      }

      if (entry.isFile() && isRouteModule(entry.name)) {
        foundFiles.push(entryPath);
      }
    }),
  );

  return foundFiles;
}

/**
 * Finds static, indexable candidate routes directly from the route directory.
 *
 * Dynamic routes are deliberately excluded because their full URL inventory
 * must come from a content/API/database source—not a route filename.
 */
export async function discoverSitemapRoutes(
  routesDirectory = ROUTES_DIRECTORY,
): Promise<SitemapRoute[]> {
  const routeFiles = await findRouteFiles(routesDirectory);

  const routes = routeFiles
    .map((sourceFile) => ({
      sourceFile,
      path: routeFileToPath(sourceFile, routesDirectory),
    }))
    .filter(
      (
        route,
      ): route is {
        sourceFile: string;
        path: string;
      } => Boolean(route.path),
    )
    .filter((route) => !isExcludedPath(route.path));

  const deduplicatedRoutes = new Map<string, SitemapRoute>();

  for (const route of routes) {
    const normalizedPath = normalizePath(route.path);

    const existing = deduplicatedRoutes.get(normalizedPath);

    if (existing) {
      throw new Error(
        [
          `Duplicate sitemap path detected: ${normalizedPath}`,
          `- ${relative(PROJECT_ROOT, existing.sourceFile)}`,
          `- ${relative(PROJECT_ROOT, route.sourceFile)}`,
          'Add an explicit ROUTE_ALIASES entry or rename one route module.',
        ].join('\n'),
      );
    }

    deduplicatedRoutes.set(normalizedPath, {
      path: normalizedPath,
      sourceFile: route.sourceFile,
    });
  }

  return [...deduplicatedRoutes.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

export function buildSitemapXml(paths: readonly string[]): string {
  const uniqueUrls = [...new Set(paths.map(normalizePath))]
    .map(toAbsoluteUrl)
    .sort((left, right) => left.localeCompare(right));

  const urlEntries = uniqueUrls
    .map((url) =>
      ['  <url>', `    <loc>${escapeXml(url)}</loc>`, '  </url>'].join('\n'),
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    '</urlset>',
    '',
  ].join('\n');
}

export async function generateSitemapFile(
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
): Promise<string> {
  const discoveredRoutes = await discoverSitemapRoutes();
  const sitemapXml = buildSitemapXml(
    discoveredRoutes.map((route) => route.path),
  );

  await mkdir(outputDirectory, { recursive: true });

  const sitemapPath = join(outputDirectory, 'sitemap.xml');

  await writeFile(sitemapPath, sitemapXml, 'utf8');

  process.stdout.write(
    [
      `Generated sitemap: ${relative(PROJECT_ROOT, sitemapPath)}`,
      `Discovered ${discoveredRoutes.length} static public route(s):`,
      ...discoveredRoutes.map(
        (route) =>
          `  ${route.path} <- ${relative(PROJECT_ROOT, route.sourceFile)}`,
      ),
      '',
    ].join('\n'),
  );

  return sitemapPath;
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  void (async () => {
    const outputDirectory = process.argv[2]
      ? resolve(process.cwd(), process.argv[2])
      : DEFAULT_OUTPUT_DIRECTORY;

    await generateSitemapFile(outputDirectory);
  })();
}
