import {
  useId,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router'

const footerSections = [
  {
    title: 'Product',
    icon: 'product',
    accent: '#3b82f6',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'Pricing', to: '/pricing' },
    ],
  },
  {
    title: 'Company',
    icon: 'company',
    accent: '#a855f7',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      {
        label: 'GitHub',
        href: 'https://github.com/SinLess-Games/Aerealith',
      },
    ],
  },
  {
    title: 'Resources',
    icon: 'resources',
    accent: '#06b6d4',
    links: [
      {
        label: 'Issues',
        href: 'https://github.com/SinLess-Games/Aerealith/issues',
      },
      {
        label: 'Discussions',
        href: 'https://github.com/SinLess-Games/Aerealith/discussions',
      },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    title: 'Legal',
    icon: 'legal',
    accent: '#f43f5e',
    links: [
      { label: 'Privacy policy', to: '/policies/privacy' },
      { label: 'Terms of service', to: '/policies/terms-of-use' },
      { label: 'Security', to: '/policies/security' },
      {
        label: 'Licenses',
        href: 'https://github.com/SinLess-Games/Aerealith/blob/master/LICENSE',
      },
    ],
  },
] as const

type FooterSectionData = (typeof footerSections)[number]
type FooterSectionIcon = FooterSectionData['icon']
type MessageType = 'idle' | 'success' | 'error'

function isValidEmail(value: string) {
  const atIndex = value.indexOf('@')
  const dotIndex = value.lastIndexOf('.')

  return (
    atIndex > 0 &&
    value.indexOf('@', atIndex + 1) === -1 &&
    dotIndex > atIndex + 1 &&
    dotIndex < value.length - 1 &&
    !/\s/.test(value)
  )
}

export function PublicFooter() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('idle')

  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setMessage('Enter a valid email address.')
      setMessageType('error')
      return
    }

    setMessage("You're on the list. Welcome to Aerealith AI.")
    setMessageType('success')
    setEmail('')
  }

  function handleEmailChange(value: string) {
    setEmail(value)

    if (messageType !== 'idle') {
      setMessage('')
      setMessageType('idle')
    }
  }

  return (
    <footer className='public-footer relative z-10 mt-auto px-3 pb-3 pt-12 sm:px-5 sm:pb-5 sm:pt-16'>
      <style>{`
        :root[data-theme='light'] .public-footer {
          --footer-background: rgba(255, 255, 255, 0.78);
          --footer-surface: rgba(248, 250, 252, 0.7);
          --footer-surface-hover: rgba(255, 255, 255, 0.94);
          --footer-border: rgba(71, 85, 105, 0.18);
          --footer-border-strong: rgba(59, 130, 246, 0.34);
          --footer-heading: #0f172a;
          --footer-text: #334155;
          --footer-muted: #64748b;
          --footer-subtle: #94a3b8;
          --footer-shadow: rgba(15, 23, 42, 0.16);
          --footer-input: rgba(255, 255, 255, 0.78);
          --footer-glow-blue: rgba(59, 130, 246, 0.1);
          --footer-glow-purple: rgba(168, 85, 247, 0.09);
        }

        :root[data-theme='dark'] .public-footer {
          --footer-background: rgba(2, 6, 23, 0.8);
          --footer-surface: rgba(15, 23, 42, 0.58);
          --footer-surface-hover: rgba(30, 41, 59, 0.78);
          --footer-border: rgba(148, 163, 184, 0.17);
          --footer-border-strong: rgba(34, 211, 238, 0.32);
          --footer-heading: #f8fafc;
          --footer-text: #cbd5e1;
          --footer-muted: #94a3b8;
          --footer-subtle: #64748b;
          --footer-shadow: rgba(0, 0, 0, 0.4);
          --footer-input: rgba(2, 6, 23, 0.64);
          --footer-glow-blue: rgba(37, 99, 235, 0.12);
          --footer-glow-purple: rgba(126, 34, 206, 0.11);
        }

        .public-footer {
          color: var(--footer-heading);
        }

        .public-footer .footer-shell {
          border-color: var(--footer-border);
          background:
            radial-gradient(
              circle at 8% 0%,
              var(--footer-glow-blue),
              transparent 32%
            ),
            radial-gradient(
              circle at 92% 100%,
              var(--footer-glow-purple),
              transparent 38%
            ),
            var(--footer-background);
          box-shadow:
            0 28px 90px var(--footer-shadow),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .public-footer .footer-heading {
          color: var(--footer-heading);
        }

        .public-footer .footer-text {
          color: var(--footer-text);
        }

        .public-footer .footer-muted {
          color: var(--footer-muted);
        }

        .public-footer .footer-link {
          color: var(--footer-muted);
        }

        .public-footer .footer-link:hover,
        .public-footer .footer-link:focus-visible {
          color: var(--ae-accent);
        }

        .public-footer .footer-divider {
          border-color: var(--footer-border);
        }

        .public-footer .footer-social {
          color: var(--footer-muted);
          border-color: var(--footer-border);
          background: var(--footer-surface);
        }

        .public-footer .footer-social:hover,
        .public-footer .footer-social:focus-visible {
          color: var(--social-accent);
          border-color: color-mix(
            in srgb,
            var(--social-accent) 62%,
            var(--footer-border)
          );
          background: color-mix(
            in srgb,
            var(--social-accent) 9%,
            var(--footer-surface-hover)
          );
          box-shadow:
            0 0 22px
              color-mix(
                in srgb,
                var(--social-accent) 22%,
                transparent
              );
        }

        .public-footer .footer-newsletter {
          border-color: var(--footer-border);
          background: var(--footer-surface);
        }

        .public-footer .footer-input-shell {
          border-color: var(--footer-border);
          background: var(--footer-input);
        }

        .public-footer .footer-input-shell:focus-within {
          border-color: var(--ae-accent);
          box-shadow:
            0 0 0 3px
              color-mix(
                in srgb,
                var(--ae-accent) 12%,
                transparent
              ),
            0 0 26px
              color-mix(
                in srgb,
                var(--ae-accent) 13%,
                transparent
              );
        }

        .public-footer .footer-input {
          color: var(--footer-heading);
        }

        .public-footer .footer-input::placeholder {
          color: var(--footer-subtle);
        }

        .public-footer .footer-mobile-section {
          border-color: var(--footer-border);
        }

        .public-footer .footer-mobile-section[open] {
          background: color-mix(
            in srgb,
            var(--section-accent) 5%,
            transparent
          );
        }

        .public-footer .footer-bottom {
          border-color: var(--footer-border);
        }

        .public-footer .footer-top-button {
          color: var(--ae-accent);
          border-color: var(--footer-border);
          background: var(--footer-surface);
        }

        .public-footer .footer-top-button:hover,
        .public-footer .footer-top-button:focus-visible {
          border-color: var(--footer-border-strong);
          background: var(--footer-surface-hover);
          box-shadow:
            0 0 22px
              color-mix(
                in srgb,
                var(--ae-accent) 18%,
                transparent
              );
        }
      `}</style>

      <div className='footer-shell relative mx-auto w-full max-w-7xl overflow-hidden rounded-3xl border backdrop-blur-2xl'>
        {/* Subtle top highlight. */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/55 to-transparent'
        />

        {/* Decorative lower glows. */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute bottom-0 left-0 h-48 w-80 bg-[radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.12),transparent_68%)]'
        />

        <div
          aria-hidden='true'
          className='pointer-events-none absolute right-0 bottom-0 h-48 w-80 bg-[radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_68%)]'
        />

        <div
          className={[
            'relative grid min-w-0 gap-10 p-6 sm:p-8 lg:p-10',
            'md:grid-cols-2',
            'xl:grid-cols-[minmax(220px,0.95fr)_minmax(0,2.5fr)_minmax(260px,1.1fr)]',
            'xl:items-start xl:gap-12',
          ].join(' ')}
        >
          <FooterBrand />

          {/*
           * Desktop navigation.
           *
           * This occupies a full row at medium and large widths, then moves
           * into the center column at extra-large widths. Each section is
           * explicitly min-width: 0 so headings cannot overlap neighboring
           * columns.
           */}
          <nav
            aria-label='Footer navigation'
            className={[
              'hidden min-w-0 gap-x-8 gap-y-10 md:grid',
              'md:col-span-2 md:grid-cols-2',
              'lg:grid-cols-4',
              'xl:col-span-1 xl:grid-cols-4 xl:gap-x-7',
            ].join(' ')}
          >
            {footerSections.map((section) => (
              <FooterSection key={section.title} {...section} />
            ))}
          </nav>

          {/* Mobile accordion navigation. */}
          <div className='footer-divider divide-y border-y md:hidden'>
            {footerSections.map((section) => (
              <MobileFooterSection key={section.title} {...section} />
            ))}
          </div>

          <Newsletter
            email={email}
            message={message}
            messageType={messageType}
            onEmailChange={handleEmailChange}
            onSubmit={subscribe}
          />
        </div>

        <div
          className={[
            'footer-bottom relative mx-6 flex flex-col items-center gap-5',
            'border-t py-6 text-center text-xs',
            'sm:mx-8 sm:flex-row sm:justify-between sm:text-left',
            'lg:mx-10',
          ].join(' ')}
        >
          <span className='footer-muted'>
            {'\u00A9'} {new Date().getFullYear()} Aerealith AI. All rights
            reserved.
          </span>

          <span className='footer-muted inline-flex items-center gap-1.5'>
            Made with
            <span className='inline-flex text-fuchsia-500'>
              <HeartIcon />
            </span>
            by SinLess Games LLC
          </span>

          <div className='flex items-center gap-3'>
            <span className='footer-muted hidden items-center gap-2 sm:flex'>
              <GlobeIcon />
              English
            </span>

            <button
              type='button'
              aria-label='Back to top'
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={[
                'footer-top-button grid h-11 w-11 place-items-center rounded-xl',
                'border transition duration-200 hover:-translate-y-1',
                'focus-visible:outline-2 focus-visible:outline-offset-2',
                'focus-visible:outline-[var(--ae-accent)]',
              ].join(' ')}
            >
              <ArrowUpIcon />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterBrand() {
  return (
    <section className='min-w-0 md:self-start'>
      <Link
        to='/'
        aria-label='Aerealith AI home'
        className={[
          'group inline-flex max-w-full items-center gap-3 rounded-xl',
          'focus-visible:outline-2 focus-visible:outline-offset-4',
          'focus-visible:outline-[var(--ae-accent)]',
        ].join(' ')}
      >
        <span className='relative grid h-12 w-12 shrink-0 place-items-center'>
          <span
            aria-hidden='true'
            className='absolute inset-1 rounded-xl bg-gradient-to-br from-fuchsia-500/20 via-violet-500/12 to-cyan-500/20 blur-md'
          />

          <img
            src='/images/brand/mark-no-background.png'
            alt=''
            width={48}
            height={48}
            className='relative h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.3)] transition group-hover:scale-105'
          />
        </span>

        <span
          className='footer-heading truncate text-xl leading-7 font-semibold tracking-wide'
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          Aerealith AI
        </span>
      </Link>

      <p className='footer-muted mt-5 max-w-xs text-sm leading-6'>
        Your digital life, intelligently connected.
        <br />
        Secure. Modular. Built for the future.
      </p>

      <div className='mt-6 flex flex-wrap gap-3'>
        <SocialLink
          href='https://discord.gg/aerealith'
          label='Join the Aerealith AI Discord'
          accent='#5865f2'
        >
          <DiscordIcon />
        </SocialLink>

        <SocialLink
          href='https://www.patreon.com/aerealith'
          label='Support Aerealith AI on Patreon'
          accent='#ff424d'
        >
          <PatreonIcon />
        </SocialLink>

        <SocialLink
          href='mailto:support@aerealith.com'
          label='Email Aerealith AI'
          accent='#06b6d4'
        >
          <MailIcon />
        </SocialLink>

        <SocialLink
          href='https://github.com/SinLess-Games/Aerealith'
          label='Aerealith AI on GitHub'
          accent='#a855f7'
        >
          <GitHubIcon />
        </SocialLink>
      </div>
    </section>
  )
}

function FooterSection({ accent, icon, links, title }: FooterSectionData) {
  return (
    <section
      className='min-w-0'
      style={
        {
          '--section-accent': accent,
        } as CSSProperties
      }
    >
      {/*
       * A div is used instead of h2 because the application's global
       * typography rules style headings at display sizes.
       */}
      <div className='footer-heading flex min-w-0 items-center gap-2 text-sm leading-5 font-semibold'>
        <span
          className='grid h-7 w-7 shrink-0 place-items-center rounded-lg border'
          style={{
            color: accent,
            borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
            background: `color-mix(in srgb, ${accent} 8%, transparent)`,
          }}
          aria-hidden='true'
        >
          <SectionIcon name={icon} />
        </span>

        <span className='min-w-0 truncate'>{title}</span>
      </div>

      <ul className='mt-5 grid min-w-0 gap-3'>
        {links.map((link) => (
          <li key={link.label} className='min-w-0'>
            <FooterLink {...link} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function MobileFooterSection(section: FooterSectionData) {
  return (
    <details
      className='footer-mobile-section group border-b last:border-b-0'
      style={
        {
          '--section-accent': section.accent,
        } as CSSProperties
      }
    >
      <summary
        className={[
          'footer-heading flex cursor-pointer list-none items-center',
          'justify-between rounded-xl px-1 py-4 text-sm leading-5 font-semibold',
          'transition',
        ].join(' ')}
      >
        <span className='flex min-w-0 items-center gap-3'>
          <span
            className='grid h-8 w-8 shrink-0 place-items-center rounded-lg border'
            style={{
              color: section.accent,
              borderColor: `color-mix(in srgb, ${section.accent} 35%, transparent)`,
              background: `color-mix(in srgb, ${section.accent} 8%, transparent)`,
            }}
            aria-hidden='true'
          >
            <SectionIcon name={section.icon} />
          </span>

          <span className='truncate'>{section.title}</span>
        </span>

        <ChevronIcon />
      </summary>

      <ul className='grid gap-1 pb-4 pl-12'>
        {section.links.map((link) => (
          <li key={link.label}>
            <FooterLink {...link} mobile />
          </li>
        ))}
      </ul>
    </details>
  )
}

function FooterLink({
  href,
  label,
  mobile = false,
  to,
}: {
  href?: string
  label: string
  mobile?: boolean
  to?: string
}) {
  const className = [
    'footer-link inline-flex max-w-full items-center gap-2 text-sm leading-5',
    'transition-colors focus-visible:rounded-sm focus-visible:outline-2',
    'focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]',
    mobile ? 'py-2.5' : '',
  ].join(' ')

  if (to) {
    return (
      <Link to={to} className={className}>
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={className}
    >
      <span>{label}</span>
      <ExternalLinkIcon />
    </a>
  )
}

function Newsletter({
  email,
  message,
  messageType,
  onEmailChange,
  onSubmit,
}: {
  email: string
  message: string
  messageType: MessageType
  onEmailChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const emailId = useId()
  const messageId = useId()

  return (
    <section
      className={[
        'footer-newsletter min-w-0 self-start rounded-2xl border p-5',
        'backdrop-blur-md md:self-stretch lg:p-6 xl:self-start',
      ].join(' ')}
    >
      {/*
       * A div is used instead of h2 to avoid global heading styles making
       * this label oversized.
       */}
      <div className='footer-heading flex items-center gap-3 text-sm leading-5 font-semibold'>
        <span className='grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-500'>
          <MailIcon />
        </span>

        <span>Stay in the loop</span>
      </div>

      <p className='footer-muted mt-4 text-sm leading-6'>
        Get updates on product progress, funding, releases, and early access.
      </p>

      <form className='mt-5' onSubmit={onSubmit} noValidate>
        <label htmlFor={emailId} className='sr-only'>
          Email address
        </label>

        <div className='footer-input-shell flex min-w-0 rounded-xl border p-1 transition'>
          <input
            id={emailId}
            type='email'
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder='Enter your email'
            autoComplete='email'
            aria-describedby={messageId}
            aria-invalid={messageType === 'error'}
            className='footer-input min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none'
          />

          <button
            type='submit'
            aria-label='Join the Aerealith AI mailing list'
            className={[
              'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
              'bg-gradient-to-br from-fuchsia-600 via-violet-500 to-cyan-500',
              'text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]',
              'transition duration-200 hover:scale-105 hover:brightness-110',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-cyan-400',
            ].join(' ')}
          >
            <ArrowRightIcon />
          </button>
        </div>

        <p
          id={messageId}
          className={[
            'mt-3 min-h-5 text-xs leading-5',
            messageType === 'error'
              ? 'text-rose-500'
              : messageType === 'success'
                ? 'text-emerald-500'
                : 'footer-muted',
          ].join(' ')}
          aria-live='polite'
        >
          {message || 'We respect your privacy. No spam, ever.'}
        </p>
      </form>
    </section>
  )
}

function SocialLink({
  accent,
  children,
  href,
  label,
}: {
  accent: string
  children: ReactNode
  href: string
  label: string
}) {
  const isExternal = href.startsWith('http')

  return (
    <a
      href={href}
      aria-label={label}
      className={[
        'footer-social grid h-11 w-11 place-items-center rounded-xl border',
        'transition duration-200 hover:-translate-y-1',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[var(--social-accent)]',
      ].join(' ')}
      style={
        {
          '--social-accent': accent,
        } as CSSProperties
      }
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  )
}

function SectionIcon({ name }: { name: FooterSectionIcon }) {
  switch (name) {
    case 'product':
      return (
        <Icon className='h-4 w-4'>
          <path d='m12 3 7 4v10l-7 4-7-4V7l7-4Z' />
          <path d='m5 7 7 4 7-4M12 11v10' />
        </Icon>
      )

    case 'company':
      return (
        <Icon className='h-4 w-4'>
          <path d='M4 21V5l8-3 8 3v16' />
          <path d='M2 21h20M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1' />
        </Icon>
      )

    case 'resources':
      return (
        <Icon className='h-4 w-4'>
          <path d='M6 3h9l3 3v15H6V3Z' />
          <path d='M14 3v4h4M9 12h6M9 16h6' />
        </Icon>
      )

    case 'legal':
      return (
        <Icon className='h-4 w-4'>
          <rect x='5' y='10' width='14' height='11' rx='2' />
          <path d='M8 10V7a4 4 0 0 1 8 0v3M12 14v3' />
        </Icon>
      )
  }
}

function Icon({
  children,
  className = 'h-5 w-5',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      className={className}
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      {children}
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 24 24'
      className='h-4 w-4 fill-current'
    >
      <path d='M12 21s-7.5-4.6-9.6-9C.8 8.6 2.6 5 6.2 5c2.1 0 3.5 1.2 4.3 2.4C11.3 6.2 12.7 5 14.8 5c3.6 0 5.4 3.6 3.8 7-2.1 4.4-6.6 9-6.6 9Z' />
    </svg>
  )
}

function MailIcon() {
  return (
    <Icon>
      <rect x='3' y='5' width='18' height='14' rx='2' />
      <path d='m4 7 8 6 8-6' />
    </Icon>
  )
}

function DiscordIcon() {
  return (
    <Icon>
      <path d='M8.2 7.2A10 10 0 0 1 12 6.5a10 10 0 0 1 3.8.7' />
      <path d='M7.3 5.3 5.4 7a14.3 14.3 0 0 0-2 8.2 9.7 9.7 0 0 0 4.8 2.4l1.2-1.7' />
      <path d='M16.7 5.3 18.6 7a14.3 14.3 0 0 1 2 8.2 9.7 9.7 0 0 1-4.8 2.4l-1.2-1.7' />
      <circle cx='9' cy='13' r='1' fill='currentColor' stroke='none' />
      <circle cx='15' cy='13' r='1' fill='currentColor' stroke='none' />
    </Icon>
  )
}

function PatreonIcon() {
  return (
    <Icon>
      <circle cx='15.5' cy='8.5' r='5.5' />
      <path d='M4 3v18' />
    </Icon>
  )
}

function GitHubIcon() {
  return (
    <Icon>
      <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1 0S17.9-.4 15 1.6a13.4 13.4 0 0 0-6 0C6.1-.4 4.9 0 4.9 0a5.4 5.4 0 0 0-.2 3A5.8 5.8 0 0 0 3.2 7.1c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 9 18v4' />
      <path d='M9 19c-3 .9-3-1.5-4.2-2' />
    </Icon>
  )
}

function ArrowRightIcon() {
  return (
    <Icon>
      <path d='M5 12h14m-5-5 5 5-5 5' />
    </Icon>
  )
}

function ArrowUpIcon() {
  return (
    <Icon>
      <path d='M12 19V5m-5 5 5-5 5 5' />
    </Icon>
  )
}

function ChevronIcon() {
  return (
    <span className='shrink-0 transition-transform duration-200 group-open:rotate-180'>
      <Icon>
        <path d='m7 10 5 5 5-5' />
      </Icon>
    </span>
  )
}

function GlobeIcon() {
  return (
    <Icon className='h-4 w-4'>
      <circle cx='12' cy='12' r='9' />
      <path d='M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' />
    </Icon>
  )
}

function ExternalLinkIcon() {
  return (
    <Icon className='h-3.5 w-3.5 shrink-0 opacity-45'>
      <path d='M15 3h6v6' />
      <path d='m10 14 11-11' />
      <path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' />
    </Icon>
  )
}
