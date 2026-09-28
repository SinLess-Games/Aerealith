// apps/frontend/src/app/routes/docs-sites/docs.developer.route.tsx

import { Helmet } from 'react-helmet-async';

import { DocsPage } from '../../features/docs';
import { RouteMetadataHead } from '../../util/route-metadata';

const SITE_URL = 'https://aerealith.com';

/**
 * Update this path if the route table uses a different public URL.
 *
 * Examples:
 * - /docs/developer
 * - /developers
 * - /developer-docs
 */
const DEVELOPER_DOCS_PATH = '/docs/developer';

const DEVELOPER_DOCS_TITLE = 'Developer Documentation | Aerealith';

const DEVELOPER_DOCS_DESCRIPTION =
  'Explore Aerealith developer documentation, integration guidance, API concepts, authentication expectations, and tools for building approved connected workflows.';

/**
 * Public landing page for Aerealith developer documentation.
 *
 * Individual documentation articles should each declare their own title,
 * description, canonical URL, dates, and BreadcrumbList when they are added.
 */
export function DeveloperDocsRoute() {
  const canonicalUrl = `${SITE_URL}${DEVELOPER_DOCS_PATH}`;

  return (
    <>
      <RouteMetadataHead
        title={DEVELOPER_DOCS_TITLE}
        description={DEVELOPER_DOCS_DESCRIPTION}
        path={DEVELOPER_DOCS_PATH}
      />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                '@id': `${canonicalUrl}#webpage`,
                url: canonicalUrl,
                name: DEVELOPER_DOCS_TITLE,
                description: DEVELOPER_DOCS_DESCRIPTION,
                inLanguage: 'en-US',
                isPartOf: {
                  '@id': `${SITE_URL}/#website`,
                },
                about: {
                  '@id': `${SITE_URL}/#organization`,
                },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': `${canonicalUrl}#breadcrumb`,
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: `${SITE_URL}/`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Documentation',
                    item: `${SITE_URL}/docs`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: 'Developer Documentation',
                    item: canonicalUrl,
                  },
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <DocsPage audience="developer" />
    </>
  );
}

export default DeveloperDocsRoute;
