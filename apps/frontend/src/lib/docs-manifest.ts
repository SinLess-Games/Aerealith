interface DocsFrontmatter {
  audience?: 'user' | 'developer';
  badge?: string;
  confidence?: string;
  decisionDate?: string | number;
  description: string;
  draft?: boolean;
  hidden?: boolean;
  icon?: string;
  keywords?: string[];
  owners?: string[];
  order?: number;
  related?: string[];
  researchStarted?: string | number;
  researchType?: string;
  status?: string;
  title: string;
  updated?: string | number;
}

interface FrontmatterModule {
  frontmatter: DocsFrontmatter;
}

const frontmatterModules = import.meta.glob<FrontmatterModule>(
  '../../../../libs/content/src/en/docs/{user,developer}/**/*.{md,mdx}',
  {
    eager: true,
    import: 'frontmatter',
    query: {
      collection: 'docs',
      only: 'frontmatter',
    },
  },
);

const rawModules = import.meta.glob<string>(
  '../../../../libs/content/src/en/docs/{user,developer}/**/*.{md,mdx}',
  {
    eager: true,
    import: 'default',
    query: '?raw',
  },
);

const contentRoot = '/libs/content/src/en/docs/';

/**
 * Browser-safe, eagerly available metadata used to build navigation and
 * search. Compiled MDX bodies remain lazy through `docsClient`.
 */
export const docsManifestEntries = Object.entries(frontmatterModules).map(
  ([absolutePath, frontmatter]) => {
    const markerIndex = absolutePath.replaceAll('\\', '/').indexOf(contentRoot);
    const path =
      markerIndex >= 0
        ? absolutePath
            .replaceAll('\\', '/')
            .slice(markerIndex + contentRoot.length)
        : absolutePath.split('/').slice(-2).join('/');

    return {
      path,
      frontmatter,
      headings: extractHeadings(rawModules[absolutePath] ?? ''),
      searchText: toSearchText(rawModules[absolutePath] ?? ''),
    };
  },
);

function extractHeadings(source: string) {
  return source.split(/\r?\n/u).flatMap((line) => {
    let depth = 0;

    while (depth < line.length && line.codePointAt(depth) === 35) depth += 1;

    if (
      depth < 2 ||
      depth > 4 ||
      line.length === depth ||
      line[depth]?.trim() !== ''
    ) {
      return [];
    }

    const title = line
      .slice(depth)
      .replaceAll('*', '')
      .replaceAll('_', '')
      .replaceAll('`', '')
      .replaceAll('[', '')
      .replaceAll(']', '')
      .trim();

    return title
      ? [
          {
            depth,
            title,
            url: `#${slugify(title)}`,
          },
        ]
      : [];
  });
}

function toSearchText(source: string) {
  return source
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/[`#>*_[\](){}<>/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
}
