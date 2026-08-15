import { describe, expect, it } from 'vitest';

import {
  getAdminEntity,
  listAdminEntityDefinitions,
} from './admin-entity-registry';

describe('admin entity registry', () => {
  it('discovers every exported database table without duplicate aliases', () => {
    const definitions = listAdminEntityDefinitions();
    const names = definitions.map((definition) => definition.name);

    expect(names.length).toBeGreaterThanOrEqual(20);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(
      expect.arrayContaining([
        'users',
        'user_sessions',
        'organizations',
        'waitlist_entries',
        'newsletter_recipients',
        'roles',
        'permissions',
      ]),
    );
    expect(definitions.every((definition) => definition.canCreate)).toBe(true);
  });

  it('redacts credential and location fields in catalog metadata', () => {
    const users = getAdminEntity('users');
    const sessions = getAdminEntity('sessions');

    expect(
      users?.definition.columns.find((column) => column.key === 'passwordHash'),
    ).toMatchObject({ sensitive: true });
    expect(
      sessions?.definition.columns.find((column) => column.key === 'tokenHash'),
    ).toMatchObject({ sensitive: true });
    expect(
      sessions?.definition.columns.find((column) => column.key === 'geoIp'),
    ).toMatchObject({ sensitive: true });
    expect(sessions?.definition.name).toBe('user_sessions');
  });
});
