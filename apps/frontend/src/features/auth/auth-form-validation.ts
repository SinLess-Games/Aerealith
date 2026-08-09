import { meetsPasswordPolicy, passwordPolicyHint } from './password-policy';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const usernamePattern = /^[a-z0-9_]{3,32}$/u;

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

export function validateLoginIdentity(value: string) {
  const identity = value.trim();
  if (!identity) return 'Enter your username or email.';
  if (identity.includes('@') && !isValidEmail(identity)) {
    return 'Enter a valid email address.';
  }
  if (!identity.includes('@') && !usernamePattern.test(identity)) {
    return 'Enter a valid username or email address.';
  }
  return undefined;
}

export function validateSignUpFields({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) {
  return {
    ...(usernamePattern.test(username.trim())
      ? {}
      : { username: 'Use 3–32 lowercase letters, numbers, or underscores.' }),
    ...(isValidEmail(email) ? {} : { email: 'Enter a valid email address.' }),
    ...(meetsPasswordPolicy(password) ? {} : { password: passwordPolicyHint }),
  };
}
