// .markdownlint.mjs

/**
 * Markdownlint config for Aerealith.
 *
 * Keep Markdown docs readable without fighting tables, frontmatter,
 * Mermaid blocks, and long planning documents.
 *
 * @type {import('markdownlint').Options['config']}
 */
const config = {
  default: true,

  /**
   * MD003/heading-style
   *
   * Use ATX headings:
   *
   * # Heading
   * ## Heading
   */
  MD003: {
    style: 'atx',
  },

  /**
   * MD004/ul-style
   *
   * Use hyphen bullets consistently.
   */
  MD004: {
    style: 'dash',
  },

  /**
   * MD007/ul-indent
   *
   * Two-space unordered list indentation.
   */
  MD007: {
    indent: 2,
  },

  /**
   * MD009/no-trailing-spaces
   *
   * Allow two trailing spaces for Markdown hard breaks.
   */
  MD009: {
    br_spaces: 2,
    list_item_empty_lines: false,
    strict: false,
  },

  /**
   * MD010/no-hard-tabs
   */
  MD010: true,

  /**
   * MD012/no-multiple-blanks
   */
  MD012: {
    maximum: 2,
  },

  /**
   * MD013/line-length
   *
   * Do not punish tables or code blocks. Tables get ugly fast when
   * forced to wrap. Prettier already owns most formatting.
   */
  MD013: false,

  /**
   * MD022/blanks-around-headings
   */
  MD022: {
    lines_above: 1,
    lines_below: 1,
  },

  /**
   * MD024/no-duplicate-heading
   *
   * Allow duplicate headings as long as they are not siblings.
   * This is useful in long docs with repeated section patterns.
   */
  MD024: false,
  /**
   * MD025/single-title/single-h1
   *
   * Keep exactly one H1 per document.
   */
  MD025: {
    level: 1,
    front_matter_title: '',
  },

  /**
   * MD026/no-trailing-punctuation
   *
   * Allow punctuation in headings because docs sometimes need paths,
   * questions, and commands as headings.
   */
  MD026: {
    punctuation: '.,;:!',
  },

  /**
   * MD028/blanks-around-headers
   *
   * Allow blank lines around headings to improve readability.
   */
  MD028: false,

  /**
   * MD029/ol-prefix
   */
  MD029: {
    style: 'ordered',
  },

  /**
   * MD031/blanks-around-fences
   */
  MD031: {
    list_items: true,
  },

  /**
   * MD032/blanks-around-lists
   */
  MD032: true,

  /**
   * MD033/no-inline-html
   *
   * Disabled so docs can use controlled HTML comments or future
   * Markdown tooling hints.
   */
  MD033: false,

  /**
   * MD034/no-bare-urls
   */
  MD034: true,

  /**
   * MD040/fenced-code-language
   *
   * Require code fence languages. Use text for plain examples.
   */
  MD040: true,

  /**
   * MD041/first-line-heading
   *
   * Disabled because RFCs use YAML frontmatter.
   */
  MD041: false,

  /**
   * MD046/code-block-style
   */
  MD046: {
    style: 'fenced',
  },

  /**
   * MD048/code-fence-style
   */
  MD048: {
    style: 'backtick',
  },

  /**
   * MD049/emphasis-style
   */
  MD049: {
    style: 'asterisk',
  },

  /**
   * MD050/strong-style
   */
  MD050: {
    style: 'asterisk',
  },

  /**
   * MD055/table-pipe-style
   */
  MD055: {
    style: 'leading_and_trailing',
  },

  /**
   * MD056/table-column-count
   */
  MD056: true,

  /**
   * MD060/table-column-style
   *
   * Enforce compact readable tables:
   *
   * | Header | Header |
   * | --- | --- |
   * | Value | Value |
   */
  MD060: {
    style: 'pipe-aligned',
  },
}

export default config
