import { ContactDescription, contactOptions } from '@aerealith-ai/content'
import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'

type IconName =
  | 'arrow'
  | 'bolt'
  | 'discord'
  | 'document'
  | 'email'
  | 'github'
  | 'lock'
  | 'map'
  | 'patreon'
  | 'question'
  | 'tag'
  | 'user'

function Icon({
  name,
  className = 'h-5 w-5',
}: {
  name: IconName
  className?: string
}) {
  const common = {
    'aria-hidden': true,
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }
  const paths: Partial<Record<IconName, ReactNode>> = {
    arrow: (
      <>
        <path d='M5 12h14' />
        <path d='m13 6 6 6-6 6' />
      </>
    ),
    bolt: <path d='m13.2 2-9 12h7l-.4 8 9-12h-7l.4-8Z' />,
    document: (
      <>
        <path d='M6 3h8l4 4v14H6Z' />
        <path d='M14 3v5h5M9 13h6M9 17h5' />
      </>
    ),
    email: (
      <>
        <rect x='3' y='5' width='18' height='14' rx='2' />
        <path d='m4 7 8 6 8-6' />
      </>
    ),
    lock: (
      <>
        <rect x='5' y='10' width='14' height='11' rx='2' />
        <path d='M8 10V7a4 4 0 0 1 8 0v3M12 14v3' />
      </>
    ),
    map: (
      <>
        <path d='m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z' />
        <path d='M9 3v15M15 6v15' />
      </>
    ),
    question: (
      <>
        <circle cx='12' cy='12' r='9' />
        <path d='M9.8 9a2.4 2.4 0 1 1 3.2 2.3c-.8.3-1 .8-1 1.7M12 17h.01' />
      </>
    ),
    tag: (
      <>
        <path d='M20 13 13 20l-9-9V4h7Z' />
        <circle cx='8.5' cy='8.5' r='1.2' />
      </>
    ),
    user: (
      <>
        <circle cx='12' cy='8' r='3.5' />
        <path d='M5 21a7 7 0 0 1 14 0' />
      </>
    ),
    discord: (
      <>
        <path d='M7 7a13 13 0 0 1 10 0c2 3 2.5 6 2 9a12 12 0 0 1-4 2l-1-1.5M17 7l1-2M7 7 6 5M9 16.5A8 8 0 0 0 12 17a8 8 0 0 0 3-.5' />
        <circle cx='9.5' cy='12.5' r='1' fill='currentColor' />
        <circle cx='14.5' cy='12.5' r='1' fill='currentColor' />
      </>
    ),
    github: (
      <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.2 3 5.4 5.4 0 0 0 19 0s-1.2-.4-4 1.6a13.4 13.4 0 0 0-7 0C5.2-.4 4 0 4 0a5.4 5.4 0 0 0-.2 3A5.8 5.8 0 0 0 2.2 7c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 8 18v4M8 19c-3 .9-3-1.5-4.2-2' />
    ),
    patreon: <path d='M5 3v18M14.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z' />,
  }
  return <svg {...common}>{paths[name]}</svg>
}

const channelMeta = [
  { icon: 'discord' as const, accent: '#a855f7' },
  { icon: 'patreon' as const, accent: '#fb4f76' },
  { icon: 'email' as const, accent: '#06b6d4' },
  { icon: 'github' as const, accent: '#60a5fa' },
]

export function ContactRoute() {
  const channels = [
    contactOptions[0],
    contactOptions[2],
    contactOptions[1],
    contactOptions[3],
  ]
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name =
      `${data.get('firstName') ?? ''} ${data.get('lastName') ?? ''}`.trim()
    const subject = String(data.get('subject') ?? 'Contact request')
    const body = [
      `From: ${name}`,
      `Reply to: ${data.get('email') ?? ''}`,
      '',
      String(data.get('message') ?? ''),
    ].join('\n')
    window.location.href = `mailto:support@aerealith.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <main className='contact-route relative isolate flex-1 overflow-hidden bg-transparent'>
      <style>{`
      :root[data-theme='light'] .contact-route{--ch:#0f172a;--ct:#334155;--cm:#64748b;--cp:rgba(255,255,255,.72);--cf:rgba(248,250,252,.76);--cb:rgba(71,85,105,.23);--cs:rgba(15,23,42,.14)}
      :root[data-theme='dark'] .contact-route{--ch:#f8fafc;--ct:#cbd5e1;--cm:#94a3b8;--cp:rgba(3,7,24,.66);--cf:rgba(4,9,29,.72);--cb:rgba(148,163,184,.25);--cs:rgba(0,0,0,.38)}
      .contact-route{color:var(--ch)}.contact-text{color:var(--ct)}.contact-muted{color:var(--cm)}
      .contact-panel{border-color:var(--cb);background:linear-gradient(145deg,rgba(99,102,241,.08),transparent 45%),var(--cp);box-shadow:0 22px 70px var(--cs),inset 0 1px 0 rgba(255,255,255,.07)}
      .contact-field{color:var(--ch);border-color:var(--cb);background:var(--cf)}.contact-field::placeholder{color:var(--cm)}.contact-field:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.12),0 0 24px rgba(34,211,238,.1);outline:none}
      .contact-channel{--ca:#22d3ee;border-color:color-mix(in srgb,var(--ca) 32%,var(--cb))}.contact-channel:hover,.contact-channel:focus-within{border-color:color-mix(in srgb,var(--ca) 68%,transparent);transform:translateY(-3px);box-shadow:0 18px 46px var(--cs),0 0 28px color-mix(in srgb,var(--ca) 16%,transparent)}
      .channel-icon{color:var(--ca);border-color:color-mix(in srgb,var(--ca) 48%,transparent);background:color-mix(in srgb,var(--ca) 13%,transparent);box-shadow:0 0 20px color-mix(in srgb,var(--ca) 20%,transparent)}
    `}</style>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_14%_40%,rgba(37,99,235,.2),transparent_30%),radial-gradient(circle_at_60%_22%,rgba(126,34,206,.2),transparent_34%),radial-gradient(circle_at_82%_70%,rgba(217,70,239,.14),transparent_30%)]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:linear-gradient(rgba(59,130,246,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.18)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]'
      />

      <section className='mx-auto w-full max-w-[1360px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14'>
        <div className='grid items-center gap-10 lg:grid-cols-[.92fr_1.08fr] lg:gap-14'>
          <div>
            <p className='text-xs font-bold tracking-[.34em] text-cyan-400 uppercase'>
              Contact us
            </p>
            <h1 className='mt-5 text-4xl leading-[1.08] font-bold tracking-[-.045em] sm:text-5xl xl:text-6xl'>
              Let&apos;s Build the Future
              <span className='block bg-gradient-to-r from-fuchsia-500 via-violet-400 to-cyan-400 bg-clip-text text-transparent'>
                Together
              </span>
            </h1>
            <p className='contact-text mt-6 max-w-xl text-base leading-7 sm:text-lg'>
              {ContactDescription}
            </p>
            <div className='mt-8 space-y-5'>
              {[
                {
                  icon: 'bolt' as const,
                  title: 'Fast Response',
                  text: 'We aim to respond within 1-2 business days.',
                  accent: '#06b6d4',
                },
                {
                  icon: 'lock' as const,
                  title: 'Your Data is Safe',
                  text: 'We respect your privacy and never share your information.',
                  accent: '#a855f7',
                },
              ].map((item) => (
                <div key={item.title} className='flex items-center gap-4'>
                  <span
                    className='channel-icon grid h-14 w-14 shrink-0 place-items-center rounded-xl border'
                    style={{ '--ca': item.accent } as CSSProperties}
                  >
                    <Icon name={item.icon} className='h-6 w-6' />
                  </span>
                  <div>
                    <h2 className='font-semibold'>{item.title}</h2>
                    <p className='contact-muted mt-1 text-sm'>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className='contact-panel rounded-3xl border p-5 backdrop-blur-xl sm:p-7'
          >
            <div className='mb-6 flex items-center gap-4'>
              <span
                className='channel-icon grid h-14 w-14 shrink-0 place-items-center rounded-xl border'
                style={{ '--ca': '#06b6d4' } as CSSProperties}
              >
                <Icon name='email' className='h-7 w-7' />
              </span>
              <div>
                <h2 className='text-xl font-semibold sm:text-2xl'>
                  Send Us a Message
                </h2>
                <p className='contact-muted mt-1 text-sm'>
                  Fill out the form and we&apos;ll open it in your email app.
                </p>
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field
                name='firstName'
                label='First Name'
                icon='user'
                autoComplete='given-name'
              />
              <Field
                name='lastName'
                label='Last Name'
                icon='user'
                autoComplete='family-name'
              />
              <Field
                name='email'
                label='Email Address'
                icon='email'
                type='email'
                autoComplete='email'
                wide
              />
              <Field name='subject' label='Subject' icon='tag' wide />
              <label className='relative sm:col-span-2'>
                <span className='sr-only'>Message</span>
                <Icon
                  name='document'
                  className='contact-muted pointer-events-none absolute top-4 left-4 h-4 w-4'
                />
                <textarea
                  required
                  name='message'
                  rows={5}
                  placeholder='Message'
                  className='contact-field w-full resize-y rounded-xl border py-3 pr-4 pl-11 text-sm transition'
                />
              </label>
            </div>
            <button
              type='submit'
              className='mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 px-5 font-semibold text-white shadow-[0_0_28px_rgba(99,102,241,.26)] transition hover:brightness-110'
            >
              Send Message <Icon name='arrow' />
            </button>
          </form>
        </div>

        <div className='mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {channels.map((channel, index) => {
            const meta = channelMeta[index]
            return (
              <article
                key={channel.title}
                className='contact-panel contact-channel flex min-h-52 flex-col rounded-2xl border p-5 backdrop-blur-xl transition duration-300'
                style={{ '--ca': meta.accent } as CSSProperties}
              >
                <div className='flex items-start gap-4'>
                  <span className='channel-icon grid h-12 w-12 shrink-0 place-items-center rounded-xl border'>
                    <Icon name={meta.icon} className='h-6 w-6' />
                  </span>
                  <div>
                    <h2 className='font-semibold'>{channel.title}</h2>
                    <p className='contact-muted mt-2 line-clamp-3 text-sm leading-6'>
                      {channel.description}
                    </p>
                  </div>
                </div>
                <a
                  href={channel.href}
                  target={
                    channel.href.startsWith('http') ? '_blank' : undefined
                  }
                  rel={
                    channel.href.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                  className='mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold'
                  style={{ color: meta.accent }}
                >
                  {channel.buttonText}
                  <Icon name='arrow' className='h-4 w-4' />
                </a>
              </article>
            )
          })}
        </div>

        <div className='contact-panel mt-5 grid gap-6 rounded-2xl border p-6 backdrop-blur-xl md:grid-cols-[1fr_2fr] md:items-center lg:p-8'>
          <div>
            <h2 className='text-xl font-semibold'>Looking for something?</h2>
            <p className='contact-muted mt-2'>
              Here are some quick links that might help.
            </p>
          </div>
          <div className='grid gap-x-8 gap-y-3 sm:grid-cols-2'>
            {[
              {
                to: '/#features',
                icon: 'document' as const,
                title: 'Features',
                text: 'Explore features',
              },
              {
                to: '/#faq',
                icon: 'question' as const,
                title: 'FAQ',
                text: 'Find answers',
              },
              {
                to: '/about',
                icon: 'map' as const,
                title: 'About',
                text: 'Learn about Aerealith',
              },
              {
                to: '/pricing',
                icon: 'tag' as const,
                title: 'Pricing',
                text: 'View plans',
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className='group flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5'
              >
                <span
                  className='channel-icon grid h-10 w-10 place-items-center rounded-lg border'
                  style={{ '--ca': '#22d3ee' } as CSSProperties}
                >
                  <Icon name={item.icon} className='h-5 w-5' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-semibold'>
                    {item.title}
                  </span>
                  <span className='contact-muted text-sm'>{item.text}</span>
                </span>
                <Icon
                  name='arrow'
                  className='contact-muted h-4 w-4 transition group-hover:translate-x-1'
                />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function Field({
  name,
  label,
  icon,
  type = 'text',
  autoComplete,
  wide = false,
}: {
  name: string
  label: string
  icon: IconName
  type?: string
  autoComplete?: string
  wide?: boolean
}) {
  return (
    <label className={`relative ${wide ? 'sm:col-span-2' : ''}`}>
      <span className='sr-only'>{label}</span>
      <Icon
        name={icon}
        className='contact-muted pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2'
      />
      <input
        required
        type={type}
        name={name}
        autoComplete={autoComplete}
        placeholder={label}
        className='contact-field min-h-12 w-full rounded-xl border py-3 pr-4 pl-11 text-sm transition'
      />
    </label>
  )
}

export default ContactRoute
