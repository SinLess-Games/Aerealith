// libs/utils/src/ui/text.spec.ts

import { describe, expect, it } from 'vitest'

import {
  formatCount,
  formatTextList,
  getFirstTextValue,
  getInitials,
  humanizeIdentifier,
  pluralize,
  toSlug,
  truncateText,
} from './text'

describe('truncateText', () => {
  it('returns the original value when it is within the maximum length', () => {
    expect(truncateText('Aerealith AI', 20)).toBe('Aerealith AI')
  })

  it('returns the original value when it exactly matches the maximum length', () => {
    expect(truncateText('Aerie', 5)).toBe('Aerie')
  })

  it('truncates text and appends the default ellipsis', () => {
    expect(
      truncateText('Aerealith AI is a connected command center.', 20),
    ).toBe('Aerealith AI is a c…')
  })
  it('trims trailing whitespace before appending the ellipsis', () => {
    expect(truncateText('Aerealith AI    connected', 16)).toBe('Aerealith AI…')
  })

  it('supports a custom ellipsis value', () => {
    expect(truncateText('Aerealith AI platform', 15, '...')).toBe(
      'Aerealith AI...',
    )
  })

  it('returns a shortened ellipsis when the ellipsis is longer than the maximum length', () => {
    expect(truncateText('Aerealith AI', 2, '...')).toBe('..')
  })

  it('throws when maximumLength is zero', () => {
    expect(() => truncateText('Aerealith AI', 0)).toThrow(
      'maximumLength must be a positive integer.',
    )
  })

  it('throws when maximumLength is negative', () => {
    expect(() => truncateText('Aerealith AI', -1)).toThrow(
      'maximumLength must be a positive integer.',
    )
  })

  it('throws when maximumLength is not an integer', () => {
    expect(() => truncateText('Aerealith AI', 3.5)).toThrow(
      'maximumLength must be a positive integer.',
    )
  })
})

describe('getInitials', () => {
  it('returns initials from a two-word name', () => {
    expect(getInitials('Aerealith AI')).toBe('AA')
  })

  it('returns the first two initials by default for longer names', () => {
    expect(getInitials('Timothy Andrew Pierce')).toBe('TA')
  })

  it('supports a custom maximum number of initials', () => {
    expect(getInitials('Timothy Andrew Pierce', 3)).toBe('TAP')
  })

  it('trims surrounding and repeated whitespace', () => {
    expect(getInitials('  Aerealith   Command   Center  ', 3)).toBe('ACC')
  })

  it('returns an empty string for an empty value', () => {
    expect(getInitials('')).toBe('')
  })

  it('returns an empty string for whitespace-only text', () => {
    expect(getInitials('   ')).toBe('')
  })

  it('supports Unicode characters', () => {
    expect(getInitials('Élodie Åström')).toBe('ÉÅ')
  })

  it('throws when maximumInitials is zero', () => {
    expect(() => getInitials('Aerealith AI', 0)).toThrow(
      'maximumInitials must be a positive integer.',
    )
  })

  it('throws when maximumInitials is negative', () => {
    expect(() => getInitials('Aerealith AI', -1)).toThrow(
      'maximumInitials must be a positive integer.',
    )
  })

  it('throws when maximumInitials is not an integer', () => {
    expect(() => getInitials('Aerealith AI', 1.5)).toThrow(
      'maximumInitials must be a positive integer.',
    )
  })
})

describe('humanizeIdentifier', () => {
  it('converts snake_case identifiers into readable text', () => {
    expect(humanizeIdentifier('discord_server_settings')).toBe(
      'Discord server settings',
    )
  })

  it('converts kebab-case identifiers into readable text', () => {
    expect(humanizeIdentifier('automation-run-history')).toBe(
      'Automation run history',
    )
  })

  it('converts camelCase identifiers into readable text', () => {
    expect(humanizeIdentifier('discordServerSettings')).toBe(
      'Discord server settings',
    )
  })

  it('separates acronym prefixes from title-case words', () => {
    expect(humanizeIdentifier('APIResponseStatus')).toBe('Api response status')
  })

  it('normalizes repeated separators and whitespace', () => {
    expect(humanizeIdentifier('  discord___server---settings  ')).toBe(
      'Discord server settings',
    )
  })

  it('returns an empty string for an empty value', () => {
    expect(humanizeIdentifier('')).toBe('')
  })

  it('returns an empty string for whitespace-only text', () => {
    expect(humanizeIdentifier('   ')).toBe('')
  })
})

describe('pluralize', () => {
  it('returns the singular form for one item', () => {
    expect(pluralize(1, 'server')).toBe('server')
  })

  it('returns the singular form for negative one item', () => {
    expect(pluralize(-1, 'server')).toBe('server')
  })

  it('returns the default plural form for zero items', () => {
    expect(pluralize(0, 'server')).toBe('servers')
  })

  it('returns the default plural form for multiple items', () => {
    expect(pluralize(4, 'server')).toBe('servers')
  })

  it('supports custom plural forms', () => {
    expect(pluralize(2, 'analysis', 'analyses')).toBe('analyses')
  })
})

describe('formatCount', () => {
  it('formats a singular count', () => {
    expect(formatCount(1, 'integration')).toBe('1 integration')
  })

  it('formats a plural count', () => {
    expect(formatCount(4, 'integration')).toBe('4 integrations')
  })

  it('formats custom plural labels', () => {
    expect(formatCount(2, 'analysis', 'analyses')).toBe('2 analyses')
  })

  it('formats large counts with locale separators', () => {
    expect(formatCount(1_000, 'event')).toBe('1,000 events')
  })
})

describe('formatTextList', () => {
  it('returns an empty string for an empty list', () => {
    expect(formatTextList([])).toBe('')
  })

  it('returns the only value for a one-item list', () => {
    expect(formatTextList(['Discord'])).toBe('Discord')
  })

  it('formats a two-item list', () => {
    expect(formatTextList(['Discord', 'GitHub'])).toBe('Discord and GitHub')
  })

  it('formats a three-item list with an Oxford comma by default', () => {
    expect(formatTextList(['Discord', 'GitHub', 'Cloudflare'])).toBe(
      'Discord, GitHub, and Cloudflare',
    )
  })

  it('supports a custom conjunction', () => {
    expect(
      formatTextList(['Discord', 'GitHub'], {
        conjunction: 'or',
      }),
    ).toBe('Discord or GitHub')
  })

  it('supports disabling the Oxford comma', () => {
    expect(
      formatTextList(['Discord', 'GitHub', 'Cloudflare'], {
        useOxfordComma: false,
      }),
    ).toBe('Discord, GitHub and Cloudflare')
  })

  it('ignores empty and whitespace-only values', () => {
    expect(
      formatTextList(['Discord', '  ', '', 'GitHub', ' Cloudflare ']),
    ).toBe('Discord, GitHub, and Cloudflare')
  })

  it('uses "and" when the supplied conjunction is blank', () => {
    expect(
      formatTextList(['Discord', 'GitHub'], {
        conjunction: '   ',
      }),
    ).toBe('Discord and GitHub')
  })
})

describe('toSlug', () => {
  it('converts text into a URL-safe slug', () => {
    expect(toSlug('Aerealith AI: Command Center')).toBe(
      'aerealith-ai-command-center',
    )
  })

  it('normalizes accented characters', () => {
    expect(toSlug('Café Déjà Vu')).toBe('cafe-deja-vu')
  })

  it('collapses repeated separators into one hyphen', () => {
    expect(toSlug('Aerealith___AI---Platform')).toBe('aerealith-ai-platform')
  })

  it('removes leading and trailing separators', () => {
    expect(toSlug('--- Aerealith AI ---')).toBe('aerealith-ai')
  })

  it('returns an empty string for an empty value', () => {
    expect(toSlug('')).toBe('')
  })

  it('returns an empty string when no supported slug characters remain', () => {
    expect(toSlug('!!!')).toBe('')
  })
})

describe('getFirstTextValue', () => {
  it('returns the first non-empty text value', () => {
    expect(
      getFirstTextValue('', undefined, null, 'Aerealith AI', 'Aerie'),
    ).toBe('Aerealith AI')
  })

  it('ignores whitespace-only values', () => {
    expect(getFirstTextValue('   ', 'Aerie')).toBe('Aerie')
  })

  it('returns undefined when no non-empty values are available', () => {
    expect(getFirstTextValue('', '  ', undefined, null)).toBeUndefined()
  })

  it('preserves the original non-empty string value', () => {
    expect(getFirstTextValue('  Aerealith AI  ', 'Aerie')).toBe(
      '  Aerealith AI  ',
    )
  })
})
