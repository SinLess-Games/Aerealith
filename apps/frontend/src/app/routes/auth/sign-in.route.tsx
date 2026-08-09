// apps/frontend/src/app/routes/sign-in.route.tsx

import { Button, Input, Label } from '@aerealith-ai/ui';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { analyticsEvents } from '../../../analytics/analytics-events';
import { validateLoginIdentity } from '../../../features/auth/auth-form-validation';
import { useLogin } from '../../../features/auth/use-session';
import { AuthCard } from './auth-card';

/** Sign-in page: authenticates against `POST /api/V1/auth/login`. */
export function SignInRoute() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { mutate, isPending, isError, error } = useLogin();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdentityError = validateLoginIdentity(usernameOrEmail);
    const nextPasswordError = password ? '' : 'Enter your password.';
    setIdentityError(nextIdentityError ?? '');
    setPasswordError(nextPasswordError);
    if (nextIdentityError || nextPasswordError) return;
    analyticsEvents.loginStarted();
    mutate(
      { usernameOrEmail, password },
      {
        onSuccess: () => {
          analyticsEvents.loginCompleted();
          navigate('/app');
        },
      },
    );
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your Aerealith account."
      footer={
        <>
          New here?{' '}
          <Link
            className="font-semibold text-[var(--ae-accent)] underline underline-offset-4"
            to="/sign-up"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="usernameOrEmail">Username or email</Label>
          <Input
            id="usernameOrEmail"
            name="usernameOrEmail"
            autoComplete="username"
            required
            aria-invalid={Boolean(identityError)}
            aria-describedby={
              identityError ? 'sign-in-identity-error' : undefined
            }
            value={usernameOrEmail}
            onChange={(event) => {
              setUsernameOrEmail(event.target.value);
              if (identityError) setIdentityError('');
            }}
          />
          {identityError ? (
            <p
              id="sign-in-identity-error"
              role="alert"
              className="text-sm text-[var(--ae-danger-foreground)]"
            >
              {identityError}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-[var(--ae-accent)] underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-focus-ring)]"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError ? 'sign-in-password-error' : undefined
            }
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError('');
            }}
          />
          {passwordError ? (
            <p
              id="sign-in-password-error"
              role="alert"
              className="text-sm text-[var(--ae-danger-foreground)]"
            >
              {passwordError}
            </p>
          ) : null}
        </div>

        {isError ? (
          <p
            role="alert"
            className="rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] p-3 text-sm text-[var(--ae-danger-foreground)]"
          >
            {error.message}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isPending}>
          {isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default SignInRoute;
