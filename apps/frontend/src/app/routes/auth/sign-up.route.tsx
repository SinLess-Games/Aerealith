// apps/frontend/src/app/routes/sign-up.route.tsx

import { Button, Input, Label } from '@aerealith-ai/ui';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';

import { analyticsEvents } from '../../../analytics/analytics-events';
import { validateSignUpFields } from '../../../features/auth/auth-form-validation';
import {
  meetsPasswordPolicy,
  passwordPolicyHint,
} from '../../../features/auth/password-policy';
import { useSignUp } from '../../../features/auth/use-session';
import {
  AerealithTurnstile,
  isTurnstileEnabled,
} from '../../../security/turnstile';
import { AuthCard } from './auth-card';

/** Sign-up page: registers against `POST /api/V1/auth/sign-up`. */
export function SignUpRoute() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState('');
  const turnstile = useRef<TurnstileInstance>(null);
  const turnstileEnabled = isTurnstileEnabled();
  const navigate = useNavigate();
  const { mutate, isPending, isError, error } = useSignUp();
  const passwordIsValid = meetsPasswordPolicy(password);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors = validateSignUpFields({ username, email, password });
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setTurnstileError('Complete the bot-protection check to continue.');
      return;
    }
    analyticsEvents.registrationStarted();
    mutate(
      {
        username,
        email,
        password,
        ...(turnstileToken ? { turnstileToken } : {}),
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      },
      {
        onSuccess: (user) => {
          analyticsEvents.registrationCompleted();
          navigate(
            user.emailVerified
              ? '/app'
              : `/verify-email?email=${encodeURIComponent(email)}`,
          );
        },
        onError: () => {
          setTurnstileToken(null);
          turnstile.current?.reset();
        },
      },
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start with a trust-first command center for your digital life."
      footer={
        <>
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            maxLength={100}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={32}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={
              fieldErrors.username ? 'sign-up-username-error' : undefined
            }
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (fieldErrors.username)
                setFieldErrors(({ username: _username, ...rest }) => rest);
            }}
          />
          {fieldErrors.username ? (
            <p
              id="sign-up-username-error"
              role="alert"
              className="text-sm text-[var(--ae-danger-foreground)]"
            >
              {fieldErrors.username}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? 'sign-up-email-error' : undefined
            }
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email)
                setFieldErrors(({ email: _email, ...rest }) => rest);
            }}
          />
          {fieldErrors.email ? (
            <p
              id="sign-up-email-error"
              role="alert"
              className="text-sm text-[var(--ae-danger-foreground)]"
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            aria-describedby={
              fieldErrors.password
                ? 'sign-up-password-error sign-up-password-policy'
                : 'sign-up-password-policy'
            }
            aria-invalid={
              Boolean(fieldErrors.password) ||
              (Boolean(password) && !passwordIsValid)
            }
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (fieldErrors.password)
                setFieldErrors(({ password: _password, ...rest }) => rest);
            }}
          />
          <p id="sign-up-password-policy" className="text-xs">
            {passwordPolicyHint}
          </p>
          {fieldErrors.password || (password && !passwordIsValid) ? (
            <p
              id="sign-up-password-error"
              role="alert"
              className="text-sm text-[var(--ae-danger-foreground)]"
            >
              {fieldErrors.password || passwordPolicyHint}
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

        {turnstileEnabled ? (
          <div className="space-y-2">
            <AerealithTurnstile
              ref={turnstile}
              action="registration"
              onToken={(token) => {
                setTurnstileToken(token);
                if (token) setTurnstileError('');
              }}
              onError={() =>
                setTurnstileError(
                  'Bot protection could not load. Please try again.',
                )
              }
            />
            {turnstileError ? (
              <p role="alert" className="text-sm">
                {turnstileError}
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="submit"
          fullWidth
          disabled={isPending || (turnstileEnabled && !turnstileToken)}
        >
          {isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default SignUpRoute;
