import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://aerealith.com';
export const SITE_NAME = 'Aerealith';

const DEFAULT_SOCIAL_IMAGE =
  'https://aerealith.com/images/brand/aerealith-social-preview.png';

export type RobotsDirective = 'index, follow' | 'noindex, nofollow';

export type RouteMetadata = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  robots?: RobotsDirective;
  type?: 'website';
};

export const PUBLIC_ROUTE_METADATA: Record<string, RouteMetadata> = {
  '/': {
    title: 'Aerealith — Your Digital Life, Intelligently Connected',
    description:
      'Aerealith is a modular, trust-first platform in active development for connected applications, communities, information, and approved workflows.',
    path: '/',
  },
  '/pricing': {
    title: 'Aerealith Pricing',
    description:
      'Explore Aerealith plans, availability, and future options for a trust-first connected platform.',
    path: '/pricing',
  },
  '/about': {
    title: 'About Aerealith',
    description:
      'Learn about Aerealith, a modular and trust-first platform being developed for connected digital experiences and approved workflows.',
    path: '/about',
  },
  '/contact': {
    title: 'Contact Aerealith',
    description:
      'Contact the Aerealith team with questions, feedback, partnership inquiries, or support requests.',
    path: '/contact',
  },
  '/policies/privacy': {
    title: 'Privacy Policy | Aerealith',
    description:
      'Read the Aerealith privacy policy and learn how information is handled across the Aerealith platform.',
    path: '/policies/privacy',
  },
  '/policies/terms-of-use': {
    title: 'Terms of Use | Aerealith',
    description:
      'Read the Aerealith terms of use governing access to and use of the Aerealith platform.',
    path: '/policies/terms-of-use',
  },
  '/policies/security': {
    title: 'Security Policy | Aerealith',
    description:
      'Learn about Aerealith security practices, responsible disclosure expectations, and platform protection principles.',
    path: '/policies/security',
  },
  '/policies/support': {
    title: 'Support Policy | Aerealith',
    description:
      'Read the Aerealith support policy, including available support channels and service expectations.',
    path: '/policies/support',
  },
};

const PRIVATE_ROUTE_PREFIXES = [
  '/admin',
  '/account',
  '/api',
  '/auth',
  '/billing',
  '/dashboard',
  '/internal',
  '/login',
  '/register',
  '/settings',
];

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] || '/';
  const withLeadingSlash = withoutQueryOrHash.startsWith('/')
    ? withoutQueryOrHash
    : `/${withoutQueryOrHash}`;

  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

export function absoluteUrl(path: string): string {
  const normalizedPath = normalizePath(path);
  return new URL(normalizedPath, SITE_URL).toString();
}

export function isPrivateRoute(pathname: string): boolean {
  const normalizedPath = normalizePath(pathname);

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) =>
      normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export function getRouteMetadata(pathname: string): RouteMetadata | undefined {
  return PUBLIC_ROUTE_METADATA[normalizePath(pathname)];
}

export function getMetadataForPath(pathname: string): RouteMetadata {
  const normalizedPath = normalizePath(pathname);
  const knownMetadata = PUBLIC_ROUTE_METADATA[normalizedPath];

  if (knownMetadata) {
    return knownMetadata;
  }

  if (isPrivateRoute(normalizedPath)) {
    return {
      title: 'Aerealith',
      description: 'Aerealith application.',
      path: normalizedPath,
      robots: 'noindex, nofollow',
    };
  }

  return {
    title: 'Page Not Found | Aerealith',
    description: 'The requested Aerealith page could not be found.',
    path: normalizedPath,
    robots: 'noindex, nofollow',
  };
}

export function RouteMetadataHead({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = title,
  robots = 'index, follow',
  type = 'website',
}: Readonly<RouteMetadata>) {
  const canonicalUrl = absoluteUrl(path);

  return (
    <Helmet>
      <title>{title}</title>

      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />

      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />
    </Helmet>
  );
}

export function CurrentRouteMetadata() {
  const metadata = getMetadataForPath(window.location.pathname);

  return <RouteMetadataHead {...metadata} />;
}
