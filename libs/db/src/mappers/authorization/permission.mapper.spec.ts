import { describe, expect, it } from 'vitest';

import {
  permissionDisplayName,
  toNewPermissionRow,
  toPermission,
  toPermissionUpdateRow,
} from './permission.mapper';

const createdAt = new Date('2026-08-13T12:00:00.000Z');
const updatedAt = new Date('2026-08-13T13:00:00.000Z');

describe('permission mapper', () => {
  it('maps persisted permissions into the authorization domain', () => {
    expect(
      toPermission({
        id: 'permission-1',
        key: 'platform.session.revoke_all',
        scope: 'platform',
        resource: 'session',
        action: 'revoke_all',
        description: 'Revoke every session.',
        isSystem: true,
        createdAt,
        updatedAt,
      }),
    ).toEqual({
      id: 'permission-1',
      key: 'platform.session.revoke_all',
      resource: 'session',
      action: 'revoke_all',
      displayName: 'Platform · Session · Revoke All',
      description: 'Revoke every session.',
      system: true,
      enabled: true,
      createdAt,
      updatedAt,
    });
  });

  it('normalizes permission inserts without inventing optional descriptions', () => {
    expect(
      toNewPermissionRow(
        {
          key: ' Organization.Member.Invite ',
          resource: ' MEMBER ',
          action: ' INVITE ',
          displayName: 'Invite member',
          system: false,
          enabled: true,
        },
        'organization',
      ),
    ).toEqual({
      key: 'organization.member.invite',
      scope: 'organization',
      resource: 'member',
      action: 'invite',
      isSystem: false,
    });
  });

  it('maps only supplied permission updates', () => {
    expect(toPermissionUpdateRow({})).toEqual({});
    expect(
      toPermissionUpdateRow(
        {
          key: ' Platform.User.Read ',
          resource: ' USER ',
          action: ' READ ',
          description: 'Read users.',
          system: true,
        },
        'platform',
      ),
    ).toEqual({
      key: 'platform.user.read',
      scope: 'platform',
      resource: 'user',
      action: 'read',
      description: 'Read users.',
      isSystem: true,
    });
  });

  it('humanizes separator-heavy permission keys', () => {
    expect(permissionDisplayName(' platform.billing-refund.write_all ')).toBe(
      'Platform · Billing Refund · Write All',
    );
  });
});
