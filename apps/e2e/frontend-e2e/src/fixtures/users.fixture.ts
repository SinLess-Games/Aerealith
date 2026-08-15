import { randomBytes } from 'node:crypto';

import type { APIRequestContext } from '@playwright/test';

import type { E2EEnvironment } from '../config/e2e-environment';
import { readSuccess, type AuthUserResponse } from '../helpers/api';
import { E2EDatabase, e2eIdentityRules } from '../helpers/database';

export type E2EUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  emailVerified: boolean;
  status: 'active' | 'disabled' | 'suspended';
};

export type CreateE2EUserOptions = {
  emailVerified?: boolean;
  password?: string;
  status?: E2EUser['status'];
  assignUserRole?: boolean;
};

export class E2EUserFactory {
  private sequence = 0;
  private readonly trackedUserIds = new Set<string>();

  constructor(
    private readonly environment: E2EEnvironment,
    private readonly ownerRequest: APIRequestContext,
    private readonly database: E2EDatabase,
    private readonly runId: string,
  ) {}

  async create(options: CreateE2EUserOptions = {}): Promise<E2EUser> {
    const sequence = ++this.sequence;
    const username = `${e2eIdentityRules.usernamePrefix}${this.runId}_${sequence}`;
    const email = `${username}${e2eIdentityRules.emailSuffix}`;
    const password = options.password ?? createPassword();
    const status = options.status ?? 'active';
    const emailVerified = options.emailVerified ?? true;

    const response = await this.ownerRequest.post(
      '/api/V1/admin/entities/users',
      {
        data: {
          username,
          email,
          password,
          status,
          emailVerified,
          metadata: {
            e2eFixture: true,
            e2eRunId: this.runId,
          },
        },
      },
    );
    const created = await readSuccess<AuthUserResponse>(response, 201);
    this.trackedUserIds.add(created.id);

    if (options.assignUserRole ?? true) {
      await this.database.assignCanonicalUserRole(created.id);
    }

    return {
      id: created.id,
      username,
      email,
      password,
      emailVerified,
      status,
    };
  }

  track(userId: string): void {
    this.trackedUserIds.add(userId);
  }

  async cleanup(): Promise<void> {
    await this.database.cleanup(this.trackedUserIds);
    this.trackedUserIds.clear();
  }
}

function createPassword(): string {
  return `Ae1!${randomBytes(18).toString('base64url')}`;
}
