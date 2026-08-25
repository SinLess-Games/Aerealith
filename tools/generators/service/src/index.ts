import {
  Tree,
  formatFiles,
  generateFiles,
  installPackagesTask,
} from '@nx/devkit';
import * as path from 'node:path';

interface ServiceGeneratorSchema {
  name: string;
  description?: string;
  nodePort?: number;
  routePrefix?: string;
  frontendUrl?: string;
  enableWorker?: boolean;
  enableObservability?: boolean;
  enableFlagship?: boolean;
}

interface ValidatedServiceIdentity {
  serviceName: string;
  projectName: string;
  projectRoot: string;
}

const DEFAULT_NODE_PORT = 3000;
const DEFAULT_FRONTEND_URL = 'https://aerealith.com';
const SERVICE_ROOT = 'apps/services';

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .split('-')
    .filter(Boolean)
    .join('-')
    .toLowerCase();
}

function toPascalCase(value: string): string {
  return toKebabCase(value)
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}

function getCompatibilityDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateServiceName(
  tree: Tree,
  rawName: string,
): ValidatedServiceIdentity {
  const serviceName = toKebabCase(rawName);

  if (!serviceName) {
    throw new Error(
      'Service name must contain at least one alphanumeric character.',
    );
  }

  const projectName = `service-${serviceName}`;
  const projectRoot = `${SERVICE_ROOT}/${serviceName}`;

  if (tree.exists(`${projectRoot}/project.json`)) {
    throw new Error(
      `Service "${serviceName}" already exists at ${projectRoot}.`,
    );
  }

  if (tree.exists(`${projectRoot}/package.json`)) {
    throw new Error(`A package already exists at ${projectRoot}.`);
  }

  return {
    serviceName,
    projectName,
    projectRoot,
  };
}

function resolveNodePort(value: number | undefined): number {
  const port = value ?? DEFAULT_NODE_PORT;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('nodePort must be a valid TCP port between 1 and 65535.');
  }

  return port;
}

function resolveRoutePrefix(
  value: string | undefined,
  serviceName: string,
): string {
  const defaultRoute = `/api/V1/services/${serviceName}`;
  const route = value?.trim();

  if (!route) {
    return defaultRoute;
  }

  if (!route.startsWith('/')) {
    return `/${route}`;
  }

  return route;
}

function resolveFrontendUrl(value: string | undefined): string {
  const frontendUrl = value?.trim() || DEFAULT_FRONTEND_URL;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(frontendUrl);
  } catch {
    throw new Error(
      `frontendUrl must be a valid absolute URL. Received "${frontendUrl}".`,
    );
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('frontendUrl must use the http: or https: protocol.');
  }

  return parsedUrl.toString().replace(/\/$/, '');
}

export default async function serviceGenerator(
  tree: Tree,
  schema: ServiceGeneratorSchema,
) {
  const { serviceName, projectName, projectRoot } = validateServiceName(
    tree,
    schema.name,
  );

  /*
   * Derive deterministic service identity values from the normalized service
   * name. These should not be independently configurable because Nx, pnpm,
   * Docker, Cloudflare, logging, and telemetry all rely on a consistent
   * service identity.
   */
  const className = toPascalCase(serviceName);

  /*
   * Resolve configurable service options.
   */
  const description =
    schema.description?.trim() || `${className} backend service`;

  const nodePort = resolveNodePort(schema.nodePort);

  const routePrefix = resolveRoutePrefix(schema.routePrefix, serviceName);

  const frontendUrl = resolveFrontendUrl(schema.frontendUrl);

  const enableWorker = schema.enableWorker ?? true;
  const enableObservability = schema.enableObservability ?? true;
  const enableFlagship = schema.enableFlagship ?? true;

  /*
   * Pin new Cloudflare Workers services to the compatibility behavior that
   * exists on the date the service is generated.
   */
  const compatibilityDate = getCompatibilityDate();

  /*
   * Templates are the source of truth for generated service files.
   *
   * Files ending in "__tmpl__" are emitted without that suffix because
   * `tmpl` is supplied as an empty string.
   *
   * Example:
   *
   *   src/server.ts__tmpl__
   *
   * becomes:
   *
   *   src/server.ts
   */
  const filesDir = path.join(__dirname, '..', 'templates');

  generateFiles(tree, filesDir, projectRoot, {
    serviceName,
    projectName,
    className,
    description,
    nodePort,
    routePrefix,
    frontendUrl,
    enableWorker,
    enableObservability,
    enableFlagship,
    compatibilityDate,
    tmpl: '',
  });

  /*
   * Format all generated files using the workspace formatting rules.
   */
  await formatFiles(tree);

  /*
   * Refresh workspace dependencies after generation.
   *
   * Generated services have their own package.json and use workspace:*
   * dependencies, so pnpm must update workspace links and the lockfile after
   * the generator completes.
   */
  return () => {
    installPackagesTask(tree);
  };
}
