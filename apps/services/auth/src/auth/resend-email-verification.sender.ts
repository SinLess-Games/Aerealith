import { Resend } from 'resend';

import {
  createEmailVerificationEmail,
  type VerificationEmail,
} from './email-verification-email';
import { createPasswordResetEmail } from './password-reset-email';

export interface EmailVerificationSender {
  send(input: {
    email: string;
    displayName?: string;
    verificationUrl: string;
    expiresInHours: number;
  }): Promise<void>;
}

export interface PasswordResetSender {
  send(input: {
    email: string;
    displayName?: string;
    resetUrl: string;
    expiresInHours: number;
  }): Promise<void>;
}

export class ResendEmailVerificationSender implements EmailVerificationSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(input: Parameters<EmailVerificationSender['send']>[0]) {
    const message: VerificationEmail = createEmailVerificationEmail(input);
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error)
      throw new Error(
        `Resend rejected the verification email: ${error.message}`,
      );
  }
}

export class ResendPasswordResetSender implements PasswordResetSender {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async send(input: Parameters<PasswordResetSender['send']>[0]): Promise<void> {
    const message = createPasswordResetEmail(input);
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: input.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      throw new Error(
        `Resend rejected the password reset email: ${error.message}`,
      );
    }
  }
}

export class ConsoleEmailVerificationSender implements EmailVerificationSender {
  async send(): Promise<void> {
    // Development fallback: avoids leaking verification URLs or tokens to logs.
  }
}

export class ConsolePasswordResetSender implements PasswordResetSender {
  async send(): Promise<void> {
    // Development fallback: never print reset URLs or tokens.
  }
}
