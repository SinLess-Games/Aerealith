import type { OperationObserver } from '@aerealith-ai/observability';

import {
  AuthApplicationError,
  type AuthApplication,
} from './auth-application.service';

type AuthOperation = keyof AuthApplication;

/**
 * Adds use-case telemetry once, independent of HTTP, GraphQL, or tRPC.
 * Account identifiers, addresses, credentials, and tokens are never emitted.
 */
export class ObservableAuthApplication implements AuthApplication {
  constructor(
    private readonly application: AuthApplication,
    private readonly observer: OperationObserver,
  ) {}

  signUp(...args: Parameters<AuthApplication['signUp']>) {
    return this.observe('signUp', () => this.application.signUp(...args));
  }

  login(...args: Parameters<AuthApplication['login']>) {
    return this.observe('login', () => this.application.login(...args));
  }

  currentUser(...args: Parameters<AuthApplication['currentUser']>) {
    return this.observe('currentUser', () =>
      this.application.currentUser(...args),
    );
  }

  logout(...args: Parameters<AuthApplication['logout']>) {
    return this.observe('logout', () => this.application.logout(...args));
  }

  verifyEmail(...args: Parameters<AuthApplication['verifyEmail']>) {
    return this.observe('verifyEmail', () =>
      this.application.verifyEmail(...args),
    );
  }

  resendVerification(
    ...args: Parameters<AuthApplication['resendVerification']>
  ) {
    return this.observe('resendVerification', () =>
      this.application.resendVerification(...args),
    );
  }
  requestPasswordReset(
    ...args: Parameters<AuthApplication['requestPasswordReset']>
  ) {
    return this.observe('requestPasswordReset', () =>
      this.application.requestPasswordReset(...args),
    );
  }
  completePasswordReset(
    ...args: Parameters<AuthApplication['completePasswordReset']>
  ) {
    return this.observe('completePasswordReset', () =>
      this.application.completePasswordReset(...args),
    );
  }
  listSessions(...args: Parameters<AuthApplication['listSessions']>) {
    return this.observe('listSessions', () =>
      this.application.listSessions(...args),
    );
  }
  revokeSession(...args: Parameters<AuthApplication['revokeSession']>) {
    return this.observe('revokeSession', () =>
      this.application.revokeSession(...args),
    );
  }
  revokeOtherSessions(
    ...args: Parameters<AuthApplication['revokeOtherSessions']>
  ) {
    return this.observe('revokeOtherSessions', () =>
      this.application.revokeOtherSessions(...args),
    );
  }

  adminOverview(...args: Parameters<AuthApplication['adminOverview']>) {
    return this.observe('adminOverview', () =>
      this.application.adminOverview(...args),
    );
  }

  accountDetails(...args: Parameters<AuthApplication['accountDetails']>) {
    return this.observe('accountDetails', () =>
      this.application.accountDetails(...args),
    );
  }

  updateAccount(...args: Parameters<AuthApplication['updateAccount']>) {
    return this.observe('updateAccount', () =>
      this.application.updateAccount(...args),
    );
  }

  profileDetails(...args: Parameters<AuthApplication['profileDetails']>) {
    return this.observe('profileDetails', () =>
      this.application.profileDetails(...args),
    );
  }

  updateProfile(...args: Parameters<AuthApplication['updateProfile']>) {
    return this.observe('updateProfile', () =>
      this.application.updateProfile(...args),
    );
  }

  listAdminEntities(...args: Parameters<AuthApplication['listAdminEntities']>) {
    return this.observe('listAdminEntities', () =>
      this.application.listAdminEntities(...args),
    );
  }

  adminEntityCatalog(
    ...args: Parameters<AuthApplication['adminEntityCatalog']>
  ) {
    return this.observe('adminEntityCatalog', () =>
      this.application.adminEntityCatalog(...args),
    );
  }

  createAdminEntity(...args: Parameters<AuthApplication['createAdminEntity']>) {
    return this.observe('createAdminEntity', () =>
      this.application.createAdminEntity(...args),
    );
  }

  updateAdminEntity(...args: Parameters<AuthApplication['updateAdminEntity']>) {
    return this.observe('updateAdminEntity', () =>
      this.application.updateAdminEntity(...args),
    );
  }

  deleteAdminEntity(...args: Parameters<AuthApplication['deleteAdminEntity']>) {
    return this.observe('deleteAdminEntity', () =>
      this.application.deleteAdminEntity(...args),
    );
  }

  private observe<T>(operation: AuthOperation, execute: () => Promise<T>) {
    return this.observer.observe(operation, execute, (error) =>
      error instanceof AuthApplicationError ? error.code : 'INTERNAL_ERROR',
    );
  }
}
