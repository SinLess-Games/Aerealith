// apps/frontend/src/app/routes/marketing-site/pricing.route.tsx

import { useState, type CSSProperties, type ReactNode } from 'react'

type BillingCycle = 'monthly' | 'yearly'

type PlanId =
  | 'free'
  | 'basic'
  | 'basic-plus'
  | 'premium'
  | 'premium-plus'
  | 'pro'
  | 'pro-plus'

interface PricingPlan {
  id: PlanId
  name: string
  monthlyPrice: number
  description: string
  buttonLabel: string
  accent: string
}

interface Capability {
  name: string
  description?: string
  values: Record<PlanId, ReactNode>
}

interface ValueProposition {
  title: string
  description: string
  accent: string
  icon:
    | 'shield'
    | 'cube'
    | 'brain'
    | 'chart'
    | 'lock'
    | 'users'
    | 'globe'
    | 'rocket'
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    description:
      'Everything you need to get started with Aerealith AI—free forever.',
    buttonLabel: 'Get Started',
    accent: '#00d9ff',
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 5,
    description: 'Personal users who want core assistant features.',
    buttonLabel: 'Start Basic',
    accent: '#00f5d4',
  },
  {
    id: 'basic-plus',
    name: 'Basic+',
    monthlyPrice: 10,
    description: 'Power users who want more customization and integrations.',
    buttonLabel: 'Start Basic+',
    accent: '#a8ff00',
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 15,
    description:
      'Advanced users who want automation and expanded assistant capabilities.',
    buttonLabel: 'Start Premium',
    accent: '#d98cff',
  },
  {
    id: 'premium-plus',
    name: 'Premium+',
    monthlyPrice: 20,
    description: 'Developers, creators, and prosumers who need advanced tools.',
    buttonLabel: 'Start Premium+',
    accent: '#ff4f67',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 25,
    description: 'Small teams, businesses, and technical users.',
    buttonLabel: 'Start Pro',
    accent: '#ff9500',
  },
  {
    id: 'pro-plus',
    name: 'Pro+',
    monthlyPrice: 30,
    description:
      'Growing teams that need higher limits, stronger automation, and deeper integrations.',
    buttonLabel: 'Start Pro+',
    accent: '#00b8ff',
  },
]

function CheckMark() {
  return (
    <span className='pricing-check' aria-label='Included'>
      ✓
    </span>
  )
}

function NotIncluded() {
  return (
    <span className='pricing-not-included' aria-label='Not included'>
      —
    </span>
  )
}

const capabilities: Capability[] = [
  {
    name: 'AI Assistant & Chat',
    values: {
      free: <CheckMark />,
      basic: <CheckMark />,
      'basic-plus': <CheckMark />,
      premium: <CheckMark />,
      'premium-plus': <CheckMark />,
      pro: <CheckMark />,
      'pro-plus': <CheckMark />,
    },
  },
  {
    name: 'Web Search & Knowledge',
    values: {
      free: <CheckMark />,
      basic: <CheckMark />,
      'basic-plus': <CheckMark />,
      premium: <CheckMark />,
      'premium-plus': <CheckMark />,
      pro: <CheckMark />,
      'pro-plus': <CheckMark />,
    },
  },
  {
    name: 'File Upload & Analysis',
    values: {
      free: 'Up to 3 files',
      basic: 'Up to 10 files',
      'basic-plus': 'Up to 25 files',
      premium: 'Up to 100 files',
      'premium-plus': 'Up to 250 files',
      pro: 'Up to 500 files',
      'pro-plus': 'Up to 1,000 files',
    },
  },
  {
    name: 'Apps & Integrations',
    description: 'Connect any number',
    values: {
      free: 'Up to 3 integrations',
      basic: 'Up to 10 integrations',
      'basic-plus': 'Up to 25 integrations',
      premium: 'Up to 50 integrations',
      'premium-plus': 'Up to 100 integrations',
      pro: 'Up to 150 integrations',
      'pro-plus': 'Up to 500 integrations',
    },
  },
  {
    name: 'Automations & Workflows',
    values: {
      free: '3',
      basic: '10',
      'basic-plus': '25',
      premium: '50',
      'premium-plus': '100',
      pro: '250',
      'pro-plus': '500',
    },
  },
  {
    name: 'Custom Dashboards',
    values: {
      free: '2',
      basic: '3',
      'basic-plus': '5',
      premium: '10',
      'premium-plus': '25',
      pro: '50',
      'pro-plus': 'Unlimited (Advanced)',
    },
  },
  {
    name: 'Memory & Context',
    values: {
      free: '30 days',
      basic: '30 days',
      'basic-plus': '60 days',
      premium: '90 days',
      'premium-plus': '1 year',
      pro: '2 years',
      'pro-plus': '3 years',
    },
  },
  {
    name: 'Team Collaboration',
    values: {
      free: <NotIncluded />,
      basic: <NotIncluded />,
      'basic-plus': 'Up to 3 users',
      premium: 'Up to 10 users',
      'premium-plus': 'Up to 25 users',
      pro: 'Up to 50 users',
      'pro-plus': 'Up to 100 users',
    },
  },
  {
    name: 'API Access',
    values: {
      free: 'Limited',
      basic: 'Limited',
      'basic-plus': 'Limited',
      premium: 'Standard',
      'premium-plus': 'Advanced',
      pro: 'Advanced',
      'pro-plus': 'Advanced + all keys',
    },
  },
  {
    name: 'Developer API',
    description: 'Rate limited',
    values: {
      free: <NotIncluded />,
      basic: <NotIncluded />,
      'basic-plus': <CheckMark />,
      premium: <CheckMark />,
      'premium-plus': <CheckMark />,
      pro: <CheckMark />,
      'pro-plus': <CheckMark />,
    },
  },
  {
    name: 'Advanced Security',
    values: {
      free: 'Standard',
      basic: 'Standard',
      'basic-plus': 'Standard',
      premium: 'Enhanced',
      'premium-plus': 'Enhanced',
      pro: 'Advanced',
      'pro-plus': 'Advanced + SSO',
    },
  },
  {
    name: 'Storage',
    values: {
      free: '1 GB',
      basic: '2 GB',
      'basic-plus': '5 GB',
      premium: '20 GB',
      'premium-plus': '50 GB',
      pro: '250 GB',
      'pro-plus': '1 TB',
    },
  },
  {
    name: 'Usage Limit',
    description: 'AI messages per month',
    values: {
      free: (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
      basic: (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
      'basic-plus': (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
      premium: (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
      'premium-plus': (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
      pro: (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
      'pro-plus': (
        <>
          No limit
          <small>Priority and rate limited</small>
        </>
      ),
    },
  },
  {
    name: 'Data Export Formats',
    values: {
      free: 'CSV',
      basic: 'CSV, JSON',
      'basic-plus': 'CSV, JSON, YAML',
      premium: 'CSV, JSON, YAML',
      'premium-plus': 'CSV, JSON, YAML',
      pro: 'CSV, JSON, YAML, PDF',
      'pro-plus': 'All formats + API',
    },
  },
  {
    name: 'Data Export',
    values: {
      free: 'Unlimited',
      basic: 'Unlimited',
      'basic-plus': 'Unlimited',
      premium: 'Unlimited',
      'premium-plus': 'Unlimited',
      pro: 'Unlimited',
      'pro-plus': 'Unlimited',
    },
  },
  {
    name: 'Data Support',
    values: {
      free: 'Community',
      basic: 'Email',
      'basic-plus': 'Email',
      premium: 'Priority email',
      'premium-plus': 'Priority email & chat',
      pro: 'Priority email, chat & phone',
      'pro-plus': 'Priority everything',
    },
  },
  {
    name: 'Audit Logs',
    values: {
      free: '1 week',
      basic: '30 days',
      'basic-plus': '30 days',
      premium: '90 days',
      'premium-plus': '180 days',
      pro: '1 year',
      'pro-plus': '2 years',
    },
  },
  {
    name: 'SSO & Directory Sync',
    values: {
      free: <NotIncluded />,
      basic: <NotIncluded />,
      'basic-plus': <NotIncluded />,
      premium: <NotIncluded />,
      'premium-plus': 'SAML / OIDC',
      pro: 'SAML / OIDC',
      'pro-plus': 'SAML / OIDC',
    },
  },
  {
    name: 'Compliance & Governance',
    values: {
      free: <NotIncluded />,
      basic: <NotIncluded />,
      'basic-plus': <NotIncluded />,
      premium: 'Standard reports',
      'premium-plus': 'Standard policies',
      pro: 'Advanced policies',
      'pro-plus': 'Advanced policies',
    },
  },
]

const valuePropositions: ValueProposition[] = [
  {
    title: 'Your data. Your control.',
    description: 'Export, delete, or manage your data at any time.',
    accent: '#ff4f67',
    icon: 'shield',
  },
  {
    title: 'Plug in. Power up.',
    description: 'Connect the tools you love. Automate everything.',
    accent: '#00d9ff',
    icon: 'cube',
  },
  {
    title: 'Built for intelligence.',
    description: 'Powerful AI that learns, understands, and adapts to you.',
    accent: '#a8ff00',
    icon: 'brain',
  },
  {
    title: 'Insights that matter.',
    description: 'Turn data into action with powerful, real-time dashboards.',
    accent: '#d98cff',
    icon: 'chart',
  },
  {
    title: 'Secure. Compliant. Trusted.',
    description:
      'Enterprise-grade security, encryption, and privacy by design.',
    accent: '#ff4f67',
    icon: 'lock',
  },
  {
    title: 'Built for everyone.',
    description: 'From solo creators to growing teams. One platform.',
    accent: '#ff9500',
    icon: 'users',
  },
  {
    title: 'Deploy anywhere.',
    description: 'Cloud, on-premises, self-hosted, or air-gapped.',
    accent: '#00b8ff',
    icon: 'globe',
  },
  {
    title: 'Start free. Scale limitless.',
    description: 'Begin your journey today and grow without limits.',
    accent: '#e879f9',
    icon: 'rocket',
  },
]

function PlanIcon({ id }: { id: PlanId }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'h-9 w-9',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.7,
    viewBox: '0 0 24 24',
  }

  switch (id) {
    case 'free':
      return (
        <svg {...commonProps}>
          <path d='M14.5 5.5C17.7 3.6 20 4 21 4c0 1-.4 3.3-2.4 6.5l-4.1 4.1-5.1-5.1 5.1-4Z' />
          <path d='m9.5 9.5-3.7.5-2.3 2.3 5.2 1.1' />
          <path d='m14.5 14.5-.5 3.7-2.3 2.3-1.1-5.2' />
          <circle cx='16.5' cy='8.5' r='1.5' />
          <path d='M5 19c1.8-.1 3.2-1.5 3.3-3.3C6.5 15.8 5.1 17.2 5 19Z' />
        </svg>
      )

    case 'basic':
      return (
        <svg {...commonProps}>
          <path d='m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.4l6.2-.9L12 2.8Z' />
        </svg>
      )

    case 'basic-plus':
      return (
        <svg {...commonProps}>
          <path d='M13.2 2 5 13h6l-.8 9L19 10h-6l.2-8Z' />
        </svg>
      )

    case 'premium':
      return (
        <svg {...commonProps}>
          <path d='m3 8 4 4 5-8 5 8 4-4-2 11H5L3 8Z' />
          <path d='M5 19h14' />
        </svg>
      )

    case 'premium-plus':
      return (
        <svg {...commonProps}>
          <path d='m12 2 8 5-8 15L4 7l8-5Z' />
          <path d='M4 7h16' />
          <path d='m8 7 4 15 4-15' />
          <path d='m8 7 4-5 4 5' />
        </svg>
      )

    case 'pro':
      return (
        <svg {...commonProps}>
          <rect x='3' y='7' width='18' height='13' rx='2' />
          <path d='M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2' />
          <path d='M3 12h18' />
          <path d='M10 12v2h4v-2' />
        </svg>
      )

    case 'pro-plus':
      return (
        <svg {...commonProps}>
          <path d='M3 17 9 11l4 4 8-9' />
          <path d='M15 6h6v6' />
        </svg>
      )
  }
}

function ValueIcon({ name }: { name: ValueProposition['icon'] }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'h-10 w-10',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.6,
    viewBox: '0 0 24 24',
  }

  switch (name) {
    case 'shield':
      return (
        <svg {...commonProps}>
          <path d='M12 3 4.5 6v5.2c0 4.6 3.1 8.1 7.5 9.8 4.4-1.7 7.5-5.2 7.5-9.8V6L12 3Z' />
          <path d='m8.5 12 2.2 2.2 4.8-5' />
        </svg>
      )

    case 'cube':
      return (
        <svg {...commonProps}>
          <path d='m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z' />
          <path d='m4 6.5 8 4.5 8-4.5' />
          <path d='M12 11v11' />
          <path d='M8 15H6' />
          <path d='M18 15h-2' />
        </svg>
      )

    case 'brain':
      return (
        <svg {...commonProps}>
          <path d='M9.5 4.5A3.5 3.5 0 0 0 6 8v.4A3.5 3.5 0 0 0 4.5 15a3.5 3.5 0 0 0 5 3.2' />
          <path d='M14.5 4.5A3.5 3.5 0 0 1 18 8v.4a3.5 3.5 0 0 1 1.5 6.6 3.5 3.5 0 0 1-5 3.2' />
          <path d='M9.5 4.5v15' />
          <path d='M14.5 4.5v15' />
        </svg>
      )

    case 'chart':
      return (
        <svg {...commonProps}>
          <path d='M4 20V12' />
          <path d='M10 20V8' />
          <path d='M16 20V4' />
          <path d='M3 8 9 4l5 3 7-5' />
        </svg>
      )

    case 'lock':
      return (
        <svg {...commonProps}>
          <rect x='4' y='10' width='16' height='11' rx='2' />
          <path d='M8 10V7a4 4 0 0 1 8 0v3' />
          <path d='M12 14v3' />
        </svg>
      )

    case 'users':
      return (
        <svg {...commonProps}>
          <circle cx='9' cy='8' r='3' />
          <circle cx='17' cy='9' r='2.5' />
          <path d='M3 20a6 6 0 0 1 12 0' />
          <path d='M14 15a5 5 0 0 1 7 4.5' />
        </svg>
      )

    case 'globe':
      return (
        <svg {...commonProps}>
          <circle cx='12' cy='12' r='9' />
          <path d='M3 12h18' />
          <path d='M12 3a14 14 0 0 1 0 18' />
          <path d='M12 3a14 14 0 0 0 0 18' />
        </svg>
      )

    case 'rocket':
      return (
        <svg {...commonProps}>
          <path d='M14.5 5.5C17.7 3.6 20 4 21 4c0 1-.4 3.3-2.4 6.5l-4.1 4.1-5.1-5.1 5.1-4Z' />
          <path d='m9.5 9.5-3.7.5-2.3 2.3 5.2 1.1' />
          <path d='m14.5 14.5-.5 3.7-2.3 2.3-1.1-5.2' />
          <circle cx='16.5' cy='8.5' r='1.5' />
        </svg>
      )
  }
}

function getPlanPrice(plan: PricingPlan, billingCycle: BillingCycle): number {
  if (billingCycle === 'yearly') {
    return Math.round(plan.monthlyPrice * 12 * 0.8)
  }

  return plan.monthlyPrice
}

export function PricingRoute() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  const isYearly = billingCycle === 'yearly'

  return (
    <main className='pricing-route relative isolate min-w-0 flex-1 overflow-hidden bg-transparent'>
      <style>{`
        :root[data-theme='light'] .pricing-route {
          --pricing-heading: #0f172a;
          --pricing-text: #334155;
          --pricing-muted: #64748b;
          --pricing-panel: rgba(255, 255, 255, 0.72);
          --pricing-panel-strong: rgba(255, 255, 255, 0.9);
          --pricing-cell: rgba(248, 250, 252, 0.78);
          --pricing-cell-alt: rgba(241, 245, 249, 0.82);
          --pricing-border: rgba(71, 85, 105, 0.2);
          --pricing-shadow: rgba(15, 23, 42, 0.13);
          --pricing-sticky: rgba(248, 250, 252, 0.97);
          --pricing-disabled: rgba(226, 232, 240, 0.8);
          --pricing-toggle: rgba(241, 245, 249, 0.86);
          --pricing-toggle-active: rgba(255, 255, 255, 0.98);
        }

        :root[data-theme='dark'] .pricing-route {
          --pricing-heading: #f8fafc;
          --pricing-text: #cbd5e1;
          --pricing-muted: #94a3b8;
          --pricing-panel: rgba(2, 6, 23, 0.62);
          --pricing-panel-strong: rgba(2, 6, 23, 0.88);
          --pricing-cell: rgba(5, 10, 28, 0.74);
          --pricing-cell-alt: rgba(8, 15, 36, 0.78);
          --pricing-border: rgba(148, 163, 184, 0.2);
          --pricing-shadow: rgba(0, 0, 0, 0.38);
          --pricing-sticky: rgba(3, 8, 23, 0.97);
          --pricing-disabled: rgba(15, 23, 42, 0.82);
          --pricing-toggle: rgba(2, 6, 23, 0.72);
          --pricing-toggle-active: rgba(30, 41, 59, 0.96);
        }

        .pricing-route {
          color: var(--pricing-heading);
        }

        .pricing-route .pricing-text {
          color: var(--pricing-text);
        }

        .pricing-route .pricing-muted {
          color: var(--pricing-muted);
        }

        .pricing-route .billing-toggle {
          border-color: var(--pricing-border);
          background: var(--pricing-toggle);
          box-shadow:
            0 12px 34px var(--pricing-shadow),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .pricing-route .billing-option {
          color: var(--pricing-muted);
        }

        .pricing-route .billing-option-active {
          color: var(--pricing-heading);
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, #8b5cf6 14%, transparent),
              color-mix(in srgb, #06b6d4 12%, transparent)
            ),
            var(--pricing-toggle-active);
          box-shadow:
            0 0 22px rgba(99, 102, 241, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .pricing-route .plans-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 0.75rem;
          width: 100%;
          min-width: 0;
        }

        @media (min-width: 40rem) {
          .pricing-route .plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 64rem) {
          .pricing-route .plans-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (min-width: 96rem) {
          .pricing-route .plans-grid {
            grid-template-columns: repeat(7, minmax(0, 1fr));
          }
        }

        .pricing-route .plan-card {
          --plan-accent: #00d9ff;

          min-width: 0;
          border-color: color-mix(
            in srgb,
            var(--plan-accent) 60%,
            var(--pricing-border)
          );

          background:
            radial-gradient(
              circle at 50% 0%,
              color-mix(in srgb, var(--plan-accent) 13%, transparent),
              transparent 46%
            ),
            var(--pricing-panel);

          box-shadow:
            0 18px 48px var(--pricing-shadow),
            0 0 24px
              color-mix(in srgb, var(--plan-accent) 13%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .pricing-route .plan-card:hover {
          border-color: color-mix(
            in srgb,
            var(--plan-accent) 84%,
            transparent
          );

          box-shadow:
            0 22px 60px var(--pricing-shadow),
            0 0 34px
              color-mix(in srgb, var(--plan-accent) 28%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .pricing-route .plan-name,
        .pricing-route .plan-icon {
          color: var(--plan-accent);
        }

        .pricing-route .plan-name {
          overflow-wrap: anywhere;
        }

        .pricing-route .plan-icon {
          filter:
            drop-shadow(
              0 0 10px
                color-mix(in srgb, var(--plan-accent) 55%, transparent)
            );
        }

        .pricing-route .purchase-button {
          color: var(--plan-accent);

          border-color: color-mix(
            in srgb,
            var(--plan-accent) 52%,
            transparent
          );

          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, var(--plan-accent) 7%, transparent),
              var(--pricing-disabled)
            );

          cursor: not-allowed;
          opacity: 0.42;
          filter: saturate(0.7);
        }

        .pricing-route .pricing-table-shell {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          border-color: var(--pricing-border);
          background: var(--pricing-panel);
          box-shadow: 0 20px 60px var(--pricing-shadow);
        }

        .pricing-route .pricing-table-scroller {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
          scrollbar-gutter: stable;
        }

        .pricing-route .pricing-table th,
        .pricing-route .pricing-table td {
          border-color: var(--pricing-border);
        }

        .pricing-route .pricing-table tbody tr:nth-child(odd) td,
        .pricing-route .pricing-table tbody tr:nth-child(odd) th {
          background: var(--pricing-cell);
        }

        .pricing-route .pricing-table tbody tr:nth-child(even) td,
        .pricing-route .pricing-table tbody tr:nth-child(even) th {
          background: var(--pricing-cell-alt);
        }

        .pricing-route .pricing-table tbody tr:hover td,
        .pricing-route .pricing-table tbody tr:hover th {
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb, #7c3aed 8%, transparent),
              color-mix(in srgb, #06b6d4 7%, transparent)
            ),
            var(--pricing-panel-strong);
        }

        .pricing-route .capability-heading {
          background: var(--pricing-sticky) !important;
          box-shadow: 8px 0 22px rgba(0, 0, 0, 0.08);
        }

        .pricing-route .plan-column-heading {
          color: var(--column-accent);

          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--column-accent) 11%, transparent),
              var(--pricing-panel-strong)
            );
        }

        .pricing-route .plan-column-cell {
          box-shadow:
            inset 0 0 18px
              color-mix(in srgb, var(--column-accent) 3%, transparent);
        }

        .pricing-route .pricing-check {
          color: var(--column-accent);
          font-size: 1.15rem;
          font-weight: 800;

          text-shadow:
            0 0 12px
              color-mix(in srgb, var(--column-accent) 60%, transparent);
        }

        .pricing-route .pricing-not-included {
          color: var(--pricing-muted);
        }

        .pricing-route .value-card {
          --value-accent: #00d9ff;

          min-width: 0;
          color: var(--value-accent);

          border-color: color-mix(
            in srgb,
            var(--value-accent) 58%,
            var(--pricing-border)
          );

          background:
            radial-gradient(
              circle at 20% 12%,
              color-mix(in srgb, var(--value-accent) 12%, transparent),
              transparent 48%
            ),
            var(--pricing-panel);

          box-shadow:
            0 14px 42px var(--pricing-shadow),
            0 0 22px
              color-mix(in srgb, var(--value-accent) 10%, transparent);
        }

        .pricing-route .value-card:hover {
          border-color: color-mix(
            in srgb,
            var(--value-accent) 82%,
            transparent
          );

          box-shadow:
            0 20px 52px var(--pricing-shadow),
            0 0 32px
              color-mix(in srgb, var(--value-accent) 26%, transparent);
        }

        .pricing-route .value-card-copy {
          color: var(--pricing-muted);
        }

        .pricing-route .value-card-heading {
          max-width: 100%;
          color: var(--value-accent);
          overflow-wrap: anywhere;
          text-wrap: balance;
        }

        .pricing-route small {
          display: block;
          margin-top: 0.15rem;
          color: var(--pricing-muted);
          font-size: 0.68rem;
          line-height: 1.25;
        }
      `}</style>

      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_20%_12%,rgba(124,58,237,0.13),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.11),transparent_32%)]'
      />

      <section className='mx-auto w-full min-w-0 max-w-[1920px] px-4 py-10 sm:px-6 lg:px-8'>
        <header className='mx-auto mb-8 max-w-3xl text-center'>
          <p className='mb-4 text-xs font-semibold tracking-[0.24em] text-cyan-500 uppercase'>
            Pricing &amp; Plans
          </p>

          <h1 className='text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl'>
            One platform.
            <span className='block bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent'>
              A plan for every workflow.
            </span>
          </h1>

          <p className='pricing-text mx-auto mt-5 max-w-2xl text-base leading-7 sm:text-lg'>
            Choose the Aerealith subscription that matches how you work today,
            then scale into deeper automation, collaboration, security, and
            deployment control as your needs grow.
          </p>

          <p className='pricing-muted mt-3 text-sm'>
            Subscription purchases are not yet available. Buttons are shown as
            previews and remain disabled.
          </p>
        </header>

        <div className='mb-8 flex justify-center'>
          <div
            className='billing-toggle inline-flex rounded-2xl border p-1.5 backdrop-blur-md'
            role='group'
            aria-label='Billing cycle'
          >
            <button
              type='button'
              aria-pressed={billingCycle === 'monthly'}
              onClick={() => setBillingCycle('monthly')}
              className={[
                'billing-option min-w-28 rounded-xl px-5 py-2.5 text-sm font-semibold transition',
                billingCycle === 'monthly'
                  ? 'billing-option-active'
                  : 'hover:text-current',
              ].join(' ')}
            >
              Monthly
            </button>

            <button
              type='button'
              aria-pressed={billingCycle === 'yearly'}
              onClick={() => setBillingCycle('yearly')}
              className={[
                'billing-option min-w-28 rounded-xl px-5 py-2.5 text-sm font-semibold transition',
                billingCycle === 'yearly'
                  ? 'billing-option-active'
                  : 'hover:text-current',
              ].join(' ')}
            >
              Yearly
              <span className='ml-2 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-400'>
                20% off
              </span>
            </button>
          </div>
        </div>

        <div className='plans-grid'>
          {plans.map((plan) => {
            const displayedPrice = getPlanPrice(plan, billingCycle)

            return (
              <article
                key={plan.id}
                className='plan-card flex min-h-[325px] min-w-0 flex-col rounded-2xl border p-4 text-center backdrop-blur-md transition duration-300 hover:-translate-y-1 sm:p-5'
                style={
                  {
                    '--plan-accent': plan.accent,
                  } as CSSProperties
                }
              >
                <h2 className='plan-name min-h-6 text-sm leading-6 font-bold tracking-wide uppercase'>
                  {plan.name}
                </h2>

                <div className='plan-icon mx-auto mt-3'>
                  <PlanIcon id={plan.id} />
                </div>

                <div className='mt-3'>
                  <p className='text-3xl leading-none font-semibold'>
                    ${displayedPrice}
                  </p>

                  <p className='pricing-muted mt-1 text-xs'>
                    {isYearly ? '/year' : '/month'}
                  </p>

                  {isYearly && plan.monthlyPrice > 0 ? (
                    <div className='mt-2 space-y-1 text-[0.7rem]'>
                      <p className='pricing-muted'>
                        <span className='mr-2 line-through'>
                          ${plan.monthlyPrice * 12}
                        </span>
                        <span className='font-semibold text-emerald-400'>
                          Save ${plan.monthlyPrice * 12 - displayedPrice}
                        </span>
                      </p>
                      <p className='pricing-muted'>
                        ${Math.round(plan.monthlyPrice * 0.8)}/month billed
                        annually
                      </p>
                    </div>
                  ) : null}

                  {isYearly && plan.monthlyPrice === 0 ? (
                    <p className='pricing-muted mt-1 text-[0.7rem]'>
                      Free forever
                    </p>
                  ) : null}
                </div>

                <p className='pricing-text mt-4 flex-1 text-xs leading-5'>
                  {plan.description}
                </p>

                <button
                  type='button'
                  disabled
                  aria-disabled='true'
                  title='Purchases are coming soon'
                  className='purchase-button mt-5 min-h-10 w-full rounded-lg border px-3 py-2 text-sm font-semibold'
                >
                  {plan.buttonLabel}
                </button>
              </article>
            )
          })}
        </div>

        <div className='pricing-table-shell mt-6 overflow-hidden rounded-2xl border backdrop-blur-md'>
          <div
            className='pricing-table-scroller'
            role='region'
            aria-label='Scrollable pricing comparison'
          >
            <table className='pricing-table w-full min-w-[1660px] border-collapse text-left text-xs'>
              <caption className='sr-only'>
                Comparison of all Aerealith subscription plans and capabilities
              </caption>

              <thead>
                <tr>
                  <th
                    scope='col'
                    className='capability-heading sticky left-0 z-30 w-[285px] min-w-[285px] border-r border-b px-5 py-4 text-xs font-bold tracking-[0.16em] text-violet-500 uppercase'
                  >
                    What you get
                  </th>

                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      scope='col'
                      className='plan-column-heading min-w-[195px] border-r border-b px-4 py-4 text-center text-sm font-bold uppercase'
                      style={
                        {
                          '--column-accent': plan.accent,
                        } as CSSProperties
                      }
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {capabilities.map((capability) => (
                  <tr key={capability.name}>
                    <th
                      scope='row'
                      className='capability-heading sticky left-0 z-20 border-r border-b px-5 py-3 font-medium'
                    >
                      <span>{capability.name}</span>

                      {capability.description ? (
                        <span className='pricing-muted ml-1 text-[0.67rem] font-normal'>
                          ({capability.description})
                        </span>
                      ) : null}
                    </th>

                    {plans.map((plan) => (
                      <td
                        key={plan.id}
                        className='plan-column-cell border-r border-b px-3 py-3 text-center align-middle leading-5'
                        style={
                          {
                            '--column-accent': plan.accent,
                          } as CSSProperties
                        }
                      >
                        {capability.values[plan.id]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {valuePropositions
            .filter((_, index) => [0, 2, 4, 7].includes(index))
            .map((item) => (
              <article
                key={item.title}
                className='value-card flex min-h-56 min-w-0 flex-col items-center rounded-lg border p-6 text-center transition duration-300 hover:-translate-y-1'
                style={
                  {
                    '--value-accent': item.accent,
                  } as CSSProperties
                }
              >
                <div className='mb-4'>
                  <ValueIcon name={item.icon} />
                </div>

                <h2 className='value-card-heading max-w-full text-base leading-6 font-bold uppercase'>
                  {item.title}
                </h2>

                <p className='value-card-copy mt-4 text-xs leading-5'>
                  {item.description}
                </p>
              </article>
            ))}
        </div>
        <footer className='pricing-muted mt-9 text-center text-sm leading-7'>
          <p>
            All plans include continuous updates, new AI models, and platform
            improvements.
          </p>

          <p>
            Prices are in USD. Yearly pricing includes a 20% discount and is
            billed once per year. Taxes may apply.
          </p>
        </footer>
      </section>
    </main>
  )
}

export default PricingRoute
