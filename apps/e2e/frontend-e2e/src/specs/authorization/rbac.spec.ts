import { test, expect } from '../../fixtures/auth.fixture';
import {
  expectNoAdminFlash,
  installAdminFlashDetector,
} from '../../helpers/auth';
import { readSuccess } from '../../helpers/api';

type AdminEntityDefinition = { name: string };

test.describe('normalized platform authorization', () => {
  test('allows the platform owner through every implemented admin category', async ({
    auth,
    browser,
  }) => {
    const owner = await auth.loginRequest(auth.platformOwner, { base: 'auth' });
    try {
      const permissionCoverage =
        await auth.database.platformOwnerPermissionCoverage(
          auth.platformOwner.id,
        );
      expect(permissionCoverage.canonical.length).toBeGreaterThan(0);
      expect(permissionCoverage.missing).toEqual([]);
      expect(permissionCoverage.assigned).toEqual(permissionCoverage.canonical);
      expect((await owner.get('/api/V1/admin/overview')).status()).toBe(200);
      const catalog = await readSuccess<AdminEntityDefinition[]>(
        await owner.get('/api/V1/admin/entities'),
        200,
      );
      expect(catalog.length).toBeGreaterThan(0);
      expect(catalog.map(({ name }) => name)).toEqual(
        expect.arrayContaining([
          'users',
          'roles',
          'permissions',
          'platform_role_assignments',
          'role_permissions',
        ]),
      );
      for (const { name } of catalog) {
        const response = await owner.get(
          `/api/V1/admin/entities/${encodeURIComponent(name)}?pageSize=1`,
        );
        expect(response.status(), `owner access to ${name}`).toBe(200);
      }
    } finally {
      await owner.dispose();
    }

    const context = await auth.newBrowserContext(browser, {
      authenticatedAs: auth.platformOwner,
    });
    try {
      const page = await context.newPage();
      await page.goto('/app/admin');
      await expect(
        page.getByRole('heading', { name: 'Admin dashboard' }),
      ).toBeVisible();
      await expect(
        page.getByText('Protected platform administration'),
      ).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('denies a normal user in navigation, direct routes, and every admin API category', async ({
    auth,
    browser,
  }) => {
    const user = await auth.users.create();
    const owner = await auth.loginRequest(auth.platformOwner);
    const normal = await auth.loginRequest(user);
    try {
      const catalog = await readSuccess<AdminEntityDefinition[]>(
        await owner.get('/api/V1/admin/entities'),
        200,
      );
      expect((await normal.get('/api/V1/admin/overview')).status()).toBe(403);
      expect((await normal.get('/api/V1/admin/entities')).status()).toBe(403);
      for (const { name } of catalog) {
        const response = await normal.get(
          `/api/V1/admin/entities/${encodeURIComponent(name)}?pageSize=1`,
        );
        expect(response.status(), `normal-user denial for ${name}`).toBe(403);
      }
    } finally {
      await owner.dispose();
      await normal.dispose();
    }

    const context = await auth.newBrowserContext(browser, {
      authenticatedAs: user,
    });
    try {
      const page = await context.newPage();
      await installAdminFlashDetector(page);
      const authorizationDenied = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).pathname === '/api/V1/admin/overview',
      );
      await page.goto('/app/admin');
      expect((await authorizationDenied).status()).toBe(403);
      await expect(page).toHaveURL(/\/app$/u);
      await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);
      await expect(
        page.getByRole('heading', { name: 'Admin dashboard' }),
      ).toHaveCount(0);
      await expectNoAdminFlash(page);
    } finally {
      await context.close();
    }
  });

  test('returns 401 to anonymous admin requests and never renders admin content', async ({
    auth,
    browser,
  }) => {
    const anonymous = await auth.newRequestContext();
    try {
      for (const path of [
        '/api/V1/admin/overview',
        '/api/V1/admin/entities',
        '/api/V1/admin/entities/users',
      ]) {
        expect((await anonymous.get(path)).status()).toBe(401);
      }
    } finally {
      await anonymous.dispose();
    }

    const context = await auth.newBrowserContext(browser);
    try {
      const page = await context.newPage();
      await installAdminFlashDetector(page);
      await page.goto('/app/admin/entities');
      await expect(page).toHaveURL(/\/sign-in$/u);
      await expectNoAdminFlash(page);
    } finally {
      await context.close();
    }
  });

  test('resists direct role, permission, user-status, and frontend-state escalation', async ({
    auth,
    browser,
  }) => {
    const attacker = await auth.users.create();
    const target = await auth.users.create();
    await auth.database.setLegacyRoleProjection(attacker.id, 'super_admin');
    const request = await auth.loginRequest(attacker);
    try {
      const attempts = [
        request.post('/api/V1/admin/entities/platform_role_assignments', {
          data: {
            userId: attacker.id,
            roleId: '00000000-0000-4000-8000-000000000001',
          },
        }),
        request.post('/api/V1/admin/entities/role_permissions', {
          data: {
            roleId: '00000000-0000-4000-8000-000000000001',
            permissionId: '00000000-0000-4000-8000-000000000002',
          },
        }),
        request.patch(`/api/V1/admin/entities/users/${target.id}`, {
          data: { status: 'suspended' },
        }),
        request.post('/api/V1/admin/entities/users', {
          data: {
            username: `e2e_forged_${Date.now()}`.slice(0, 32),
            email: `forged_${Date.now()}@e2e.aerealith.invalid`,
            password: 'GeneratedOnly1Password',
            emailVerified: true,
          },
        }),
      ];
      for (const attempt of attempts) {
        expect((await attempt).status()).toBe(403);
      }
    } finally {
      await request.dispose();
    }

    const context = await auth.newBrowserContext(browser, {
      authenticatedAs: attacker,
    });
    try {
      const page = await context.newPage();
      await page.addInitScript(() => {
        localStorage.setItem(
          'aerealith-auth',
          JSON.stringify({ role: 'super_admin', permissions: ['*'] }),
        );
      });
      await installAdminFlashDetector(page);
      const authorizationDenied = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          new URL(response.url()).pathname === '/api/V1/admin/overview',
      );
      await page.goto('/app/admin');
      expect((await authorizationDenied).status()).toBe(403);
      await expect(page).toHaveURL(/\/app$/u);
      await expectNoAdminFlash(page);

      const snapshot = await auth.database.authorizationSnapshot(attacker.id);
      expect(snapshot.legacyRole).toBe('super_admin');
      expect(snapshot.roleSlugs).toEqual(['user']);
      expect(snapshot.permissionKeys).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
