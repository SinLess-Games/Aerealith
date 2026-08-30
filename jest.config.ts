/** Root Jest configuration that delegates project discovery to Nx. */
import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => ({
  // Async discovery keeps this list synchronized with Nx project metadata.
  projects: await getJestProjectsAsync(),
});
