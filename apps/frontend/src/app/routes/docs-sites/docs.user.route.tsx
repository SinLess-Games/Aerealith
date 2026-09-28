// apps/frontend/src/app/routes/docs-sites/docs.user.route.tsx

import { Helmet } from 'react-helmet-async';

import { DocsPage } from '../../features/docs';
import { RouteMetadataHead } from '../../util/route-metadata';

const SITE_URL = 'https://aerealith.com';

/**
 * Change this only if the public React Router path differs.
 *
 * Examples:
 * - /docs/user
 * - /help
 * - /support
 * - /docs/getting-started
 */
const USER_DOCS_PATH = '/docs/user';

const USER_DOCS_TITLE = 'User Documentation | Aerealith';

const USER_DOCS_DESCRIPTION =
  'Explore Aerealith user documentation, including getting started guidance, account and privacy controls, supported workflows, and platform help.';

/**
 * Public landing page for Aerealith user documentation.
 *
 * Individual user-documentation pages should own their own metadata,
 * canonical URL, content dates, and breadcrumb trail.
 */
export function UserDocsRoute() {
  const canonicalUrl = `${SITE_URL}${USER_DOCS_PATH}`;

  return (
    <>
      <RouteMetadataHead
        title={USER_DOCS_TITLE}
        description={USER_DOCS_DESCRIPTION}
        path={USER_DOCS_PATH}
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
                name: USER_DOCS_TITLE,
                description: USER_DOCS_DESCRIPTION,
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
                    name: 'User Documentation',
                    item: canonicalUrl,
                  },
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <DocsPage audience="user" />
    </>
  );
}

export default UserDocsRoute;
