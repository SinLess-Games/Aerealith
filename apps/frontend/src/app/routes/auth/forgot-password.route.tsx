import { Button, Input, Label } from '@aerealith-ai/ui';
import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';

import { usePasswordResetRequest } from '../../../features/auth/use-auth-security';
import { isValidEmail } from '../../../features/auth/auth-form-validation';
import { AuthCard } from './auth-card';
import styles from './recovery.module.css';

export function ForgotPasswordRoute() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const reset = usePasswordResetRequest();

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    reset.mutate({ email });
  }

  if (reset.isSuccess) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle="If that email belongs to an account, we’ve sent password-reset instructions."
        footer={<Link to="/sign-in">Return to sign in</Link>}
      >
        <output className={`${styles.message} block`}>
          For your privacy, we use this same message whether or not an account
          exists.
        </output>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we’ll send a private reset link if an account is available."
      footer={<Link to="/sign-in">Return to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="recovery-email">Email address</Label>
          <Input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'recovery-email-error' : undefined}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError('');
            }}
          />
          {emailError ? (
            <p id="recovery-email-error" className={styles.error}>
              {emailError}
            </p>
          ) : null}
        </div>
        {reset.isError ? (
          <p className={styles.error} role="alert">
            We couldn’t request a reset link. Please try again.
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={reset.isPending}>
          {reset.isPending ? 'Sending reset link…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default ForgotPasswordRoute;
