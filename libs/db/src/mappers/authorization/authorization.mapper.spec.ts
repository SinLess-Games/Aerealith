import { describe, expect, it } from 'vitest';

import {
  authorizationActorId,
  isAuthorizationUuid,
  organizationRoleAssignmentId,
  parseAuthorizationAssignmentId,
  platformRoleAssignmentId,
  toAssignedByUserId,
  toOrganizationRoleAssignment,
  toPlatformRoleAssignment,
} from './authorization.mapper';

const userId = '11111111-1111-4111-8111-111111111111';
const roleId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';
const actorId = '44444444-4444-4444-8444-444444444444';
const assignedAt = new Date('2026-08-13T12:00:00.000Z');
const expiresAt = new Date('2026-08-14T12:00:00.000Z');

describe('authorization assignment mapper', () => {
  it('maps platform assignments to global authorization assignments', () => {
    expect(
      toPlatformRoleAssignment({
        userId,
        roleId,
        assignedByUserId: null,
        assignedAt,
        expiresAt: null,
      }),
    ).toEqual({
      id: `platform:${userId}:${roleId}`,
      principal: { id: userId, type: 'user' },
      roleId,
      scope: { type: 'global' },
      assignedBy: 'system',
      assignedAt,
      metadata: {},
    });
  });

  it('maps joined organization assignments with scope and expiration', () => {
    expect(
      toOrganizationRoleAssignment({
        organizationMemberId: memberId,
        organizationId: 'organization-1',
        userId,
        roleId,
        assignedByUserId: actorId,
        assignedAt,
        expiresAt,
      }),
    ).toEqual({
      id: `organization:${memberId}:${roleId}`,
      principal: { id: userId, type: 'user' },
      roleId,
      scope: { type: 'organization', id: 'organization-1' },
      assignedBy: actorId,
      assignedAt,
      expiresAt,
      metadata: {},
    });
  });

  it('generates and parses deterministic assignment identifiers', () => {
    const platformId = platformRoleAssignmentId(userId, roleId);
    const organizationId = organizationRoleAssignmentId(memberId, roleId);

    expect(parseAuthorizationAssignmentId(platformId)).toEqual({
      type: 'platform',
      userId,
      roleId,
    });
    expect(parseAuthorizationAssignmentId(organizationId)).toEqual({
      type: 'organization',
      organizationMemberId: memberId,
      roleId,
    });
  });

  it.each([
    '',
    'platform',
    `platform:${userId}`,
    `platform:not-a-uuid:${roleId}`,
    `unknown:${userId}:${roleId}`,
    `platform:${userId}:${roleId}:extra`,
  ])('rejects malformed assignment id %s', (value) => {
    expect(parseAuthorizationAssignmentId(value)).toBeUndefined();
  });

  it('converts system and user actor identifiers at the persistence boundary', () => {
    expect(authorizationActorId(null)).toBe('system');
    expect(authorizationActorId(actorId)).toBe(actorId);
    expect(toAssignedByUserId('system')).toBeNull();
    expect(toAssignedByUserId(actorId)).toBe(actorId);
    expect(isAuthorizationUuid(actorId)).toBe(true);
    expect(isAuthorizationUuid('not-a-uuid')).toBe(false);
  });
});
