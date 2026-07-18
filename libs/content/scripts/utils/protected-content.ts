import { collectPlaceholders, collectUrls } from './placeholders'

export const protectedTerms = [
  'SinLess Games LLC',
  'Aerealith AI',
  'SinLess Games',
  'LibreTranslate',
  'TypeScript',
  'JavaScript',
  'Cloudflare',
  'WebSocket',
  'Aerealith',
  'Discord',
  'GitHub',
  'Workers',
  'GraphQL',
  'Tailwind',
  'TanStack',
  'Cloudinary',
  'Grafana',
  'OAuth',
  'tRPC',
  'React',
  'Resend',
  'Vite',
  'JSON',
  'HTTPS',
  'HTTP',
  'API',
  'SDK',
  'CLI',
  'URL',
  'Nx',
] as const

export interface ProtectedText {
  text: string
  restore: (translated: string) => string
}

export function protectContent(source: string): ProtectedText {
  const values = [
    ...new Set([
      ...collectPlaceholders(source),
      ...collectUrls(source),
      ...collectEmailAddresses(source),
      ...protectedTerms.filter((term) => source.includes(term)),
    ]),
  ].sort((left, right) => right.length - left.length)
  const replacements = new Map<string, string>()
  let text = source
  values.forEach((value, index) => {
    const token = `__AEREALITH_PROTECTED_${index}__`
    replacements.set(token, value)
    text = text.split(value).join(token)
  })
  return {
    text,
    restore: (translated) => {
      let restored = translated
      for (const [token, value] of replacements) {
        restored = restored.split(token).join(value)
        restored = restored.replace(new RegExp(token, 'gi'), () => value)
      }
      return restored
    },
  }
}

const EMAIL_CANDIDATE_CHARACTERS = new Set(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._%+-@',
)

function collectEmailAddresses(source: string): string[] {
  const addresses: string[] = []
  let candidate = ''

  const collectCandidate = () => {
    const normalized = trimEmailCandidate(candidate)
    if (isEmailAddress(normalized)) addresses.push(normalized)
    candidate = ''
  }

  for (const character of source) {
    if (EMAIL_CANDIDATE_CHARACTERS.has(character)) {
      candidate += character
    } else {
      collectCandidate()
    }
  }

  collectCandidate()
  return addresses
}

function trimEmailCandidate(candidate: string): string {
  let result = candidate
  while (result.startsWith('.')) result = result.slice(1)
  while (result.endsWith('.')) result = result.slice(0, -1)
  return result
}

function isEmailAddress(candidate: string): boolean {
  const parts = candidate.split('@')
  if (parts.length !== 2) return false

  const [localPart = '', domain = ''] = parts
  const domainParts = domain.split('.')
  const topLevelDomain = domainParts.at(-1) ?? ''

  return (
    localPart.length > 0 &&
    !localPart.startsWith('.') &&
    !localPart.endsWith('.') &&
    domainParts.length >= 2 &&
    domainParts.every(isDomainPart) &&
    topLevelDomain.length >= 2 &&
    [...topLevelDomain].every(isAsciiLetter)
  )
}

function isDomainPart(part: string): boolean {
  return part.length > 0 && !part.startsWith('-') && !part.endsWith('-')
}

function isAsciiLetter(character: string): boolean {
  return (
    (character >= 'A' && character <= 'Z') ||
    (character >= 'a' && character <= 'z')
  )
}
