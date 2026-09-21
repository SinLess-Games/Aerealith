import {
  ContainerProxy,
  Sandbox,
} from '@cloudflare/sandbox';

export { ContainerProxy };

/**
 * Untrusted coding sandboxes are deny-by-default for outbound network access.
 * Only public source/package hosts required for repository work are allowed.
 * No Aerealith credentials are injected into the container.
 */
export class AerealithSandbox extends Sandbox {
  enableInternet = false;

  allowedHosts = [
    'github.com',
    '*.github.com',
    '*.githubusercontent.com',
    'registry.npmjs.org',
    '*.npmjs.org',
  ];
}
