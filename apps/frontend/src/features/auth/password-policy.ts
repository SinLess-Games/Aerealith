export function meetsPasswordPolicy(password: string) {
  return (
    password.length >= 12 &&
    /[a-z]/u.test(password) &&
    /[A-Z]/u.test(password) &&
    /\d/u.test(password)
  );
}

export const passwordPolicyHint =
  'Use at least 12 characters with uppercase and lowercase letters and a number.';
