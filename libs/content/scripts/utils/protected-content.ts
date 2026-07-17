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
  const emailMatches = source.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) ?? []
  const values = [
    ...new Set([
      ...collectPlaceholders(source),
      ...collectUrls(source),
      ...emailMatches,
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
