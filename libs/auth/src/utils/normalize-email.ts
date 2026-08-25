export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isEmailIdentifier(identifier: string): boolean {
  return identifier.includes('@');
}
