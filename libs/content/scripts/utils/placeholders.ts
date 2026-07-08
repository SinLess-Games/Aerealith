const PLACEHOLDER_PATTERNS = [
  /\{\{[^{}]+\}\}/g,
  /(?<!\{)\{[A-Za-z_$][\w$.-]*\}(?!\})/g,
  /<\/?(?:\d+|[A-Za-z][\w.-]*)>/g,
] as const

const URL_PATTERN = /(?:https?:\/\/|mailto:)[^\s<>'"`)\]]+/g

export function collectPlaceholders(value: string): string[] {
  return collectMatches(value, PLACEHOLDER_PATTERNS)
}

export function collectUrls(value: string): string[] {
  return [...(value.match(URL_PATTERN) ?? [])].sort()
}

function collectMatches(value: string, patterns: readonly RegExp[]): string[] {
  return patterns.flatMap((pattern) => value.match(pattern) ?? []).sort()
}
