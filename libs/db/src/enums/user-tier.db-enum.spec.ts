// libs/db/src/enums/user-tier.db-enum.spec.ts

import { UserTier } from '@aerealith-ai/core';
import { describe, expect, it } from 'vitest';

import { userTierDbEnum } from './user-tier.db-enum';

describe('userTierDbEnum', () => {
  it('matches the core user tier values', () => {
    expect(userTierDbEnum.enumValues).toEqual(
      Object.values(UserTier),
    );
  });
});
