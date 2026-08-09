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
  ResendEmailVerificationSender,
} from './resend-email-verification.sender';

/** Delays PostgreSQL pool creation until the first database-backed request. */
export class LazyAuthApplication implements AuthApplication {
  private application?: AuthApplication;
  private database?: DatabaseClientConnection;

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
    const apiKey = process.env['RESEND_API_KEY']?.trim();
    const sender =
      apiKey && !apiKey.startsWith('re_replace_')
        ? new ResendEmailVerificationSender(
            apiKey,
            process.env['RESEND_FROM_EMAIL'] ??
              'Aerealith <onboarding@resend.dev>',
          )
        : new ConsoleEmailVerificationSender();
    this.application ??= new AuthApplicationService(this.getDatabase().client, {
      emailSender: sender,
      frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
    });
    return this.application;
  }

  private getDatabase(): DatabaseClientConnection {
    this.database ??= createDatabaseConnection();
    return this.database;
  }
}
