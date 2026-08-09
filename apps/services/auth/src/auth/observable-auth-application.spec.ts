import type { OperationObserver } from '@aerealith-ai/observability';
import { describe, expect, it, vi } from 'vitest';

import {
  AuthApplicationError,
  type AuthApplication,
} from './auth-application.service';
import { ObservableAuthApplication } from './observable-auth-application';

describe('ObservableAuthApplication', () => {
  it('records failures without leaking operation inputs', async () => {
    const observe = vi.fn(
      async (
        _operation: string,
        execute: () => Promise<unknown>,
        classify: (error: unknown) => string,
      ) => {
        try {
          return await execute();
        } catch (error) {
          expect(classify(error)).toBe('INVALID_CREDENTIALS');
          throw error;
        }
      },
    );
    const application = {
      login: vi
        .fn()
        .mockRejectedValue(
          new AuthApplicationError('INVALID_CREDENTIALS', 'No', 401),
        ),
    } as unknown as AuthApplication;
    const observable = new ObservableAuthApplication(application, {
      observe,
    } as OperationObserver);

    await expect(
      observable.login({ usernameOrEmail: 'private', password: 'secret' }),
    ).rejects.toThrow('No');

    expect(observe).toHaveBeenCalledWith(
      'login',
      expect.any(Function),
      expect.any(Function),
    );
    expect(
      JSON.stringify(observe.mock.calls.map(([operation]) => operation)),
    ).not.toContain('secret');
  });
});
