import {
  createDatabaseConnection,
  type DatabaseClientConnection,
} from '@aerealith-ai/db';

import {
  AuthApplicationService,
  type AuthApplication,
} from './auth-application.service';
import {
  ConsoleEmailVerificationSender,
  ConsolePasswordResetSender,
  ResendEmailVerificationSender,
  ResendPasswordResetSender,
} from './resend-email-verification.sender';
import { StructuredAuthEventPublisher } from './structured-auth-event.publisher';

/** Delays PostgreSQL pool creation until the first database-backed request. */
export class LazyAuthApplication implements AuthApplication {
  private application?: AuthApplication;
  private database?: DatabaseClientConnection;

  constructor(
    private readonly bindings: {
      databaseUrl?: string;
      resendApiKey?: string;
      frontendUrl?: string;
    } = {},
  ) {}

  signUp(...args: Parameters<AuthApplication['signUp']>) {
    return this.getApplication().signUp(...args);
  }

  login(...args: Parameters<AuthApplication['login']>) {
    return this.getApplication().login(...args);
  }

  currentUser(...args: Parameters<AuthApplication['currentUser']>) {
    return this.getApplication().currentUser(...args);
  }

  logout(...args: Parameters<AuthApplication['logout']>) {
    return this.getApplication().logout(...args);
  }

  verifyEmail(...args: Parameters<AuthApplication['verifyEmail']>) {
    return this.getApplication().verifyEmail(...args);
  }

  resendVerification(
    ...args: Parameters<AuthApplication['resendVerification']>
  ) {
    return this.getApplication().resendVerification(...args);
  }
  requestPasswordReset(
    ...args: Parameters<AuthApplication['requestPasswordReset']>
  ) {
    return this.getApplication().requestPasswordReset(...args);
  }
  completePasswordReset(
    ...args: Parameters<AuthApplication['completePasswordReset']>
  ) {
    return this.getApplication().completePasswordReset(...args);
  }
  listSessions(...args: Parameters<AuthApplication['listSessions']>) {
    return this.getApplication().listSessions(...args);
  }
  revokeSession(...args: Parameters<AuthApplication['revokeSession']>) {
    return this.getApplication().revokeSession(...args);
  }
  revokeOtherSessions(
    ...args: Parameters<AuthApplication['revokeOtherSessions']>
  ) {
    return this.getApplication().revokeOtherSessions(...args);
  }

  adminOverview(...args: Parameters<AuthApplication['adminOverview']>) {
    return this.getApplication().adminOverview(...args);
  }

  accountDetails(...args: Parameters<AuthApplication['accountDetails']>) {
    return this.getApplication().accountDetails(...args);
  }

  updateAccount(...args: Parameters<AuthApplication['updateAccount']>) {
    return this.getApplication().updateAccount(...args);
  }

  listAdminEntities(...args: Parameters<AuthApplication['listAdminEntities']>) {
    return this.getApplication().listAdminEntities(...args);
  }

  updateAdminEntity(...args: Parameters<AuthApplication['updateAdminEntity']>) {
    return this.getApplication().updateAdminEntity(...args);
  }

  deleteAdminEntity(...args: Parameters<AuthApplication['deleteAdminEntity']>) {
    return this.getApplication().deleteAdminEntity(...args);
  }

  async ready(): Promise<void> {
    await this.getDatabase().pool.query('select 1');
  }

  async close(): Promise<void> {
    await this.database?.close();
  }

  private getApplication(): AuthApplication {
    const apiKey = this.bindings.resendApiKey?.trim();
    const sender =
      apiKey && !apiKey.startsWith('re_replace_')
        ? new ResendEmailVerificationSender(
            apiKey,
            'Aerealith <onboarding@resend.dev>',
          )
        : new ConsoleEmailVerificationSender();
    const passwordResetSender =
      apiKey && !apiKey.startsWith('re_replace_')
        ? new ResendPasswordResetSender(
            apiKey,
            'Aerealith <onboarding@resend.dev>',
          )
        : new ConsolePasswordResetSender();
    this.application ??= new AuthApplicationService(this.getDatabase().client, {
      emailSender: sender,
      passwordResetSender,
      events: new StructuredAuthEventPublisher(),
      frontendUrl: this.bindings.frontendUrl ?? 'http://localhost:4200',
    });
    return this.application;
  }

  private getDatabase(): DatabaseClientConnection {
    this.database ??= createDatabaseConnection(
      this.bindings.databaseUrl
        ? { DATABASE_URL: this.bindings.databaseUrl }
        : process.env,
    );
    return this.database;
  }
}
