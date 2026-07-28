import { createDatabaseClient } from '@aerealith-ai/db';

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
    this.application ??= new AuthApplicationService(createDatabaseClient(), {
      emailSender: sender,
      frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
    });
    return this.application;
  }
}
