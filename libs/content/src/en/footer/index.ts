import type { FooterProps } from '../../types'

export const footerProps = {
  brandName: 'Helix AI',
  tagline: 'Your digital life, intelligently connected.',
  logoHref: '/',

  version: null,
  versionPrefix: 'V',
  releasesUrl: 'https://github.com/SinLess-Games/Helix/releases',

  variant: 'minimal',
  dense: true,
  maxWidth: '75rem',

  linkGroups: [
    {
      title: 'Product',
      links: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'About',
          href: '/about',
        },
        {
          label: 'Contact',
          href: '/contact',
        },
        {
          label: 'Tech Stack',
          href: '/tech-stack',
        },
      ],
    },
    {
      title: 'Trust',
      links: [
        {
          label: 'Trust & Privacy',
          href: '/trust-privacy-principles',
        },
        {
          label: 'Privacy Policy',
          href: '/Policies/privacy',
        },
        {
          label: 'Terms of Use',
          href: '/Policies/terms-of-use',
        },
        {
          label: 'Security',
          href: '/Policies/security',
        },
      ],
    },
    {
      title: 'Policies',
      links: [
        {
          label: 'Responsible AI',
          href: '/Policies/responsible-ai',
        },
        {
          label: 'Cookies',
          href: '/Policies/cookie-tracking',
        },
        {
          label: 'Data Policy',
          href: '/Policies/data',
        },
        {
          label: 'Support',
          href: '/Policies/support',
        },
      ],
    },
    {
      title: 'Company',
      links: [
        {
          label: 'SinLess Games LLC',
          href: 'https://sinlessgames.com',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/SinLess-Games/Helix',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          label: 'Copyright Takedown',
          href: '/Policies/copyright-takedown',
        },
        {
          label: 'Developer Policy',
          href: '/Policies/developer',
        },
      ],
    },
  ],

  socialLinks: [
    {
      label: 'GitHub',
      href: 'https://github.com/SinLess-Games/Helix',
      target: '_blank',
      rel: 'noopener noreferrer',
      ariaLabel: 'View Helix AI on GitHub',
    },
    {
      label: 'SinLess Games',
      href: 'https://sinlessgames.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      ariaLabel: 'Visit SinLess Games LLC',
    },
  ],

  legalLinks: [
    {
      label: 'Privacy',
      href: '/Policies/privacy',
    },
    {
      label: 'Terms',
      href: '/Policies/terms-of-use',
    },
    {
      label: 'Security',
      href: '/Policies/security',
    },
    {
      label: 'Cookies',
      href: '/Policies/cookie-tracking',
    },
  ],

  copyrightHolder: 'SinLess Games LLC',
  copyrightStartYear: 2026,
} as const satisfies FooterProps

export default footerProps
