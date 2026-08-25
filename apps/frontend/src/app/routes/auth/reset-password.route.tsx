import { Button, Input, Label } from '@aerealith-ai/ui';
import { useState, type SubmitEvent } from 'react';
import { Link, useSearchParams } from 'react-router';

import {
  passwordPolicyHint,
  meetsPasswordPolicy,
} from '../../../features/auth/password-policy';
import { usePasswordResetComplete } from '../../../features/auth/use-auth-security';
import { AuthCard } from './auth-card';
import styles from './recovery.module.css';

export function ResetPasswordRoute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const reset = usePasswordResetComplete();

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !meetsPasswordPolicy(newPassword)) {
      setPasswordError(
        newPassword
          ? 'Your password does not meet the required policy.'
          : 'Enter a new password.',
      );
      return;
    }
    reset.mutate({ token, newPassword });
  }

  if (!token) {
    return (
      <AuthCard
        title="Reset link unavailable"
        subtitle="This password-reset link is missing its secure token."
      >
        <p className={styles.error} role="alert">
          Request a new reset link and use the most recent message.
        </p>
        <Link to="/forgot-password" className="mt-4 block">
          <Button fullWidth>Request a new link</Button>
        </Link>
      </AuthCard>
    );
  }

  if (reset.isSuccess) {
    return (
      <AuthCard
        title="Password updated"
        subtitle="Your password has been changed. You can now sign in with it."
      >
        <Link to="/sign-in" className="block">
          <Button fullWidth>Continue to sign in</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Use a unique password you do not reuse elsewhere."
      footer={<Link to="/sign-in">Return to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError
                ? 'new-password-error password-policy'
                : 'password-policy'
            }
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              if (passwordError) setPasswordError('');
            }}
          />
          <p id="password-policy" className={styles.policy}>
            {passwordPolicyHint}
          </p>
        </div>
        {passwordError || (newPassword && !meetsPasswordPolicy(newPassword)) ? (
          <p id="new-password-error" className={styles.error} role="alert">
            {passwordError ||
              'Your password does not meet the required policy.'}
          </p>
        ) : null}
        {reset.isError ? (
          <p className={styles.error} role="alert">
            This link has expired or could not be used. Request a new reset
            link.
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={reset.isPending}>
          {reset.isPending ? 'Updating password…' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default ResetPasswordRoute;
