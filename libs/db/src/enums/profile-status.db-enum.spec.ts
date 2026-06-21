// libs/db/src/enums/profile-status.db-enum.spec.ts

import { ProfileStatus } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { profileStatusDbEnum } from './profile-status.db-enum';

describe('profileStatusDbEnum', () => {
  it('matches the core profile status values', () => {
    expect(profileStatusDbEnum.enumValues).toEqual(
      Object.values(ProfileStatus),
    );
  });
});
