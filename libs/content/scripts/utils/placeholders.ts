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
  return collectPatternMatches(value, URL_PATTERN).sort((left, right) =>
    left.localeCompare(right),
  )
}

function collectMatches(value: string, patterns: readonly RegExp[]): string[] {
  return patterns
    .flatMap((pattern) => collectPatternMatches(value, pattern))
    .sort((left, right) => left.localeCompare(right))
}

function collectPatternMatches(value: string, pattern: RegExp): string[] {
  const matcher = new RegExp(pattern.source, pattern.flags)
  const matches: string[] = []

  for (
    let match = matcher.exec(value);
    match !== null;
    match = matcher.exec(value)
  ) {
    matches.push(match[0])
  }

  return matches
}
