import { Button, Input, Label } from '@aerealith-ai/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import {
  resendVerification,
  verifyEmail,
} from '../../../features/auth/auth-api';
import { AuthCard } from './auth-card';

type VerificationState = 'ready' | 'verifying' | 'verified' | 'error';

export function VerifyEmailRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [state, setState] = useState<VerificationState>(
    token ? 'verifying' : 'ready',
  );
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const attemptedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || attemptedToken.current === token) return;
    attemptedToken.current = token;
    void verifyEmail(token)
      .then(() => setState('verified'))
      .catch((error: Error) => {
        setMessage(error.message);
        setState('error');
      });
  }, [token]);

  async function onResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setIsResending(true);
    try {
      await resendVerification(email);
      setMessage(
        'If that address has an unverified account, a fresh link is on its way.',
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to resend the email.',
      );
    } finally {
      setIsResending(false);
    }
  }

  if (state === 'verifying') {
    return (
      <AuthCard
        title="Verifying your email"
        subtitle="Securing your Aerealith identity…"
      >
        <p
          role="status"
          className="rounded-lg border border-[var(--ae-info-border)] bg-[var(--ae-info-subtle)] p-3 text-sm text-[var(--ae-info-foreground)]"
        >
          Please keep this page open for a moment.
        </p>
      </AuthCard>
    );
  }

  if (state === 'verified') {
    return (
      <AuthCard
        title="Email verified"
        subtitle="Your identity is confirmed and your account is ready."
      >
        <Link to="/app" className="block">
          <Button fullWidth>Enter Aerealith</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={state === 'error' ? 'That link did not work' : 'Check your inbox'}
      subtitle={
        state === 'error'
          ? 'The link may have expired or already been used. Request a new one below.'
          : 'We sent a private verification link. It expires in 24 hours.'
      }
      footer={<Link to="/sign-in">Return to sign in</Link>}
    >
      <form onSubmit={onResend} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="verification-email">Email</Label>
          <Input
            id="verification-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        {message ? (
          <p
            role={message.startsWith('If that address') ? 'status' : 'alert'}
            className={`rounded-lg border p-3 text-sm ${
              message.startsWith('If that address')
                ? 'border-[var(--ae-info-border)] bg-[var(--ae-info-subtle)] text-[var(--ae-info-foreground)]'
                : 'border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] text-[var(--ae-danger-foreground)]'
            }`}
          >
            {message}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={isResending}>
          {isResending ? 'Sending a new link…' : 'Send a new verification link'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default VerifyEmailRoute;
