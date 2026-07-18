// apps/frontend/src/app/routes/home.route.tsx

import { homeLandingPageContent } from '@aerealith-ai/content'
import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'

const panelClass =
  'home-panel rounded-2xl border shadow-[0_0_30px_rgba(76,29,149,.12),inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-md'

const promiseAccentClasses = [
  'text-fuchsia-500',
  'text-violet-500',
  'text-cyan-500',
] as const

export function HomeRoute() {
  const content = homeLandingPageContent
  const [email, setEmail] = useState('')

  return (
    <div className='home-route relative isolate flex-1 overflow-hidden bg-transparent'>
      <style>{`
        :root[data-theme='light'] .home-route {
          --home-heading: #0f172a;
          --home-body: #334155;
          --home-muted: #64748b;
          --home-subtle: #94a3b8;

          --home-panel: rgba(255, 255, 255, 0.12);
          --home-panel-hover: rgba(255, 255, 255, 0.22);
          --home-panel-strong: rgba(255, 255, 255, 0.28);

          --home-card: rgba(255, 255, 255, 0.14);
          --home-card-hover: rgba(255, 255, 255, 0.28);

          --home-field: rgba(255, 255, 255, 0.34);
          --home-field-hover: rgba(255, 255, 255, 0.48);

          --home-border: rgba(71, 85, 105, 0.22);
          --home-border-strong: rgba(71, 85, 105, 0.34);

          --home-shadow: rgba(15, 23, 42, 0.14);
          --home-inset: rgba(255, 255, 255, 0.7);

          --home-button: rgba(255, 255, 255, 0.2);
          --home-button-hover: rgba(255, 255, 255, 0.36);

          --home-grid-line: rgba(37, 99, 235, 0.06);
          --home-blue-glow: rgba(14, 165, 233, 0.1);
          --home-purple-glow: rgba(168, 85, 247, 0.1);

          --home-select-option: #ffffff;
          --home-select-text: #0f172a;
        }

        :root[data-theme='dark'] .home-route {
          --home-heading: #f8fafc;
          --home-body: #cbd5e1;
          --home-muted: #94a3b8;
          --home-subtle: #64748b;

          --home-panel: rgba(2, 6, 23, 0.12);
          --home-panel-hover: rgba(2, 6, 23, 0.24);
          --home-panel-strong: rgba(2, 6, 23, 0.3);

          --home-card: rgba(2, 6, 23, 0.16);
          --home-card-hover: rgba(2, 6, 23, 0.3);

          --home-field: rgba(2, 6, 23, 0.28);
          --home-field-hover: rgba(2, 6, 23, 0.42);

          --home-border: rgba(148, 163, 184, 0.18);
          --home-border-strong: rgba(196, 181, 253, 0.3);

          --home-shadow: rgba(0, 0, 0, 0.34);
          --home-inset: rgba(255, 255, 255, 0.04);

          --home-button: rgba(2, 6, 23, 0.18);
          --home-button-hover: rgba(15, 23, 42, 0.42);

          --home-grid-line: rgba(59, 130, 246, 0.04);
          --home-blue-glow: rgba(37, 99, 235, 0.12);
          --home-purple-glow: rgba(126, 34, 206, 0.1);

          --home-select-option: #020617;
          --home-select-text: #e2e8f0;
        }

        .home-route {
          color: var(--home-heading);
        }

        .home-route .home-decorative-layer {
          background-image:
            radial-gradient(
              circle at 72% 11%,
              var(--home-purple-glow),
              transparent 24%
            ),
            radial-gradient(
              circle at 34% 2%,
              var(--home-blue-glow),
              transparent 17%
            ),
            linear-gradient(
              var(--home-grid-line) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              var(--home-grid-line) 1px,
              transparent 1px
            );
          background-size:
            auto,
            auto,
            72px 72px,
            72px 72px;
        }

        .home-route .home-heading {
          color: var(--home-heading);
        }

        .home-route .home-body {
          color: var(--home-body);
        }

        .home-route .home-muted {
          color: var(--home-muted);
        }

        .home-route .home-subtle {
          color: var(--home-subtle);
        }

        .home-route .home-panel {
          border-color: var(--home-border);
          background: var(--home-panel);
          box-shadow:
            0 16px 46px var(--home-shadow),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-panel:hover,
        .home-route .home-panel:focus-within {
          border-color: var(--home-border-strong);
          background: var(--home-panel-hover);
        }

        .home-route .home-card {
          border-color: var(--home-border);
          background: var(--home-card);
          box-shadow:
            0 12px 36px var(--home-shadow),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-card:hover,
        .home-route .home-card:focus-within {
          border-color: var(--home-border-strong);
          background: var(--home-card-hover);
        }

        .home-route .home-field {
          color: var(--home-heading);
          border-color: var(--home-border);
          background: var(--home-field);
        }

        .home-route .home-field:hover {
          background: var(--home-field-hover);
        }

        .home-route .home-field::placeholder {
          color: var(--home-subtle);
        }

        .home-route .home-field option {
          color: var(--home-select-text);
          background: var(--home-select-option);
        }

        .home-route .home-outline-link {
          color: var(--home-heading);
          border-color: var(--home-border);
          background: var(--home-button);
        }

        .home-route .home-outline-link:hover {
          border-color: rgba(139, 92, 246, 0.58);
          background: var(--home-button-hover);
        }

        .home-route .home-highlight-card {
          border-color: rgba(139, 92, 246, 0.58);
          background:
            radial-gradient(
              circle at 80% 90%,
              rgba(124, 58, 237, 0.22),
              transparent 60%
            ),
            var(--home-card);
          box-shadow:
            0 16px 42px var(--home-shadow),
            0 0 28px rgba(124, 58, 237, 0.16),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-video-card {
          border-color: rgba(139, 92, 246, 0.34);
          background:
            radial-gradient(
              circle at 50% 45%,
              rgba(82, 42, 255, 0.2),
              transparent 34%
            ),
            var(--home-card);
          box-shadow:
            0 16px 46px var(--home-shadow),
            0 0 30px rgba(82, 42, 255, 0.12),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-final-cta {
          border-color: rgba(139, 92, 246, 0.34);
          background:
            linear-gradient(
              90deg,
              rgba(37, 99, 235, 0.14),
              rgba(126, 34, 206, 0.2),
              rgba(37, 99, 235, 0.14)
            ),
            var(--home-panel-strong);
          box-shadow:
            0 18px 48px var(--home-shadow),
            0 0 34px rgba(76, 29, 149, 0.14),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-price-card {
          background: var(--home-card);
          box-shadow:
            0 14px 38px var(--home-shadow),
            0 0 22px
              color-mix(
                in srgb,
                var(--tier-accent) 12%,
                transparent
              ),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-price-card:hover {
          background: var(--home-card-hover);
          box-shadow:
            0 18px 46px var(--home-shadow),
            0 0 30px
              color-mix(
                in srgb,
                var(--tier-accent) 24%,
                transparent
              ),
            inset 0 1px 0 var(--home-inset);
        }

        .home-route .home-detail {
          border-color: var(--home-border);
          background: var(--home-card);
        }

        .home-route .home-detail[open] {
          border-color: rgba(139, 92, 246, 0.46);
          background: var(--home-card-hover);
        }

        .home-route .home-promise {
          border-color: var(--home-border);
          background: color-mix(
            in srgb,
            var(--home-card) 70%,
            transparent
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .home-route *,
          .home-route *::before,
          .home-route *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/*
       * Decorative lighting only.
       *
       * The route remains transparent so the global background image stays
       * visible behind the entire page in both light and dark themes.
       */}
      <div
        aria-hidden='true'
        className='home-decorative-layer pointer-events-none absolute inset-0 -z-10 opacity-70'
      />

      <main className='mx-auto w-full max-w-[1440px] space-y-4 px-5 pt-10 pb-10 sm:px-8 lg:px-12'>
        {/* =========================================================
            Hero
            ========================================================= */}

        <section className='grid items-center gap-8 lg:grid-cols-[1.08fr_.92fr]'>
          <div>
            <p className='inline-flex rounded-full border border-cyan-500/35 bg-cyan-500/5 px-3 py-1 text-[10px] font-semibold tracking-[0.25em] text-cyan-500 uppercase backdrop-blur-md'>
              {content.hero.eyebrow}
            </p>

            <h1 className='home-heading mt-4 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl lg:text-[3.7rem]'>
              {content.hero.title}

              <span className='mt-1 block bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent'>
                {content.hero.highlightedTitle}
              </span>
            </h1>

            <p className='home-body mt-5 max-w-2xl text-sm leading-7 sm:text-base'>
              {content.hero.description}
            </p>

            <div className='mt-6 flex flex-wrap gap-3'>
              <GradientLink {...content.hero.primaryAction} />
              <OutlineLink {...content.hero.secondaryAction} />
            </div>

            {/* =====================================================
                Waitlist
                ===================================================== */}

            <form
              id='waitlist'
              className='home-panel mt-6 rounded-2xl border border-fuchsia-400/45 p-5 shadow-[0_0_30px_rgba(89,46,255,.18),inset_0_0_28px_rgba(28,64,170,.08)] backdrop-blur-xl'
              onSubmit={(event) => event.preventDefault()}
            >
              <p className='text-xs font-semibold tracking-[0.2em] text-cyan-500 uppercase'>
                {content.waitlist.eyebrow}
              </p>

              <h2 className='home-heading mt-2 text-lg font-semibold'>
                {content.waitlist.title}
              </h2>

              <div className='mt-4 grid gap-3 sm:grid-cols-[1.2fr_.9fr_auto]'>
                <label className='sr-only' htmlFor='waitlist-email'>
                  {content.waitlist.emailLabel}
                </label>

                <input
                  id='waitlist-email'
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={content.waitlist.emailPlaceholder}
                  autoComplete='email'
                  required
                  className='home-field min-w-0 rounded-lg border px-4 py-3 text-sm outline-none backdrop-blur-md transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
                />

                <label className='sr-only' htmlFor='waitlist-role'>
                  {content.waitlist.roleLabel}
                </label>

                <select
                  id='waitlist-role'
                  defaultValue=''
                  className='home-field rounded-lg border px-4 py-3 text-sm outline-none backdrop-blur-md transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
                >
                  <option value='' disabled>
                    {content.waitlist.rolePlaceholder}
                  </option>

                  {content.waitlist.roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <button
                  type='submit'
                  className='rounded-lg bg-gradient-to-r from-fuchsia-600 via-violet-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,70,255,.28)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
                >
                  {content.waitlist.submitLabel}

                  <span className='ml-2' aria-hidden='true'>
                    →
                  </span>
                </button>
              </div>

              <p className='home-muted mt-3 text-xs'>
                {content.waitlist.privacyNote}
              </p>
            </form>
          </div>

          {/* =======================================================
              Holographic hero mark
              ======================================================= */}

          <div className='relative mx-auto grid min-h-[420px] w-full max-w-xl place-items-center'>
            <div
              aria-hidden='true'
              className='absolute h-80 w-80 rounded-full border border-violet-400/20 bg-violet-600/5 shadow-[0_0_100px_rgba(79,55,255,.3)] backdrop-blur-sm'
            />

            <div
              aria-hidden='true'
              className='absolute h-[19rem] w-[12rem] rotate-[28deg] rounded-[50%] border border-cyan-400/15'
            />

            <div
              aria-hidden='true'
              className='absolute h-[19rem] w-[12rem] -rotate-[28deg] rounded-[50%] border border-violet-400/15'
            />

            <div
              aria-hidden='true'
              className='absolute bottom-8 h-24 w-4/5 rounded-[100%] border border-cyan-400/50 bg-violet-600/10 shadow-[0_0_45px_#4424e8,inset_0_0_24px_#1677ff]'
            />

            <div
              aria-hidden='true'
              className='absolute bottom-14 h-12 w-3/5 rounded-[100%] border border-violet-400/35 bg-violet-500/5 shadow-[0_0_22px_rgba(168,85,247,.55)]'
            />

            <div
              aria-hidden='true'
              className='absolute bottom-16 h-52 w-px bg-gradient-to-t from-cyan-300 via-violet-400 to-transparent shadow-[0_0_18px_#00d9ff]'
            />

            <img
              src={content.hero.image.src}
              alt={content.hero.image.alt}
              width={320}
              height={320}
              className='relative z-10 h-64 w-64 object-contain drop-shadow-[0_0_18px_rgba(236,72,153,.65)] drop-shadow-[0_0_28px_rgba(74,165,255,.8)] sm:h-72 sm:w-72'
            />
          </div>
        </section>

        {/* =========================================================
            Promises
            ========================================================= */}

        <section className='grid gap-4 py-4 sm:grid-cols-3'>
          {content.promises.map((item, index) => (
            <article
              key={item.title}
              className='home-promise flex items-center gap-4 rounded-xl border px-5 py-4 backdrop-blur-sm sm:rounded-none sm:border-y-0 sm:border-l-0 sm:border-r sm:last:border-r-0'
            >
              <span
                className={[
                  'text-2xl',
                  promiseAccentClasses[index] ?? 'text-cyan-500',
                ].join(' ')}
                aria-hidden='true'
              >
                {['✧', '□', '◇'][index]}
              </span>

              <div>
                <h2 className='home-heading text-sm font-medium'>
                  {item.title}
                </h2>

                <p className='home-muted text-xs'>{item.description}</p>
              </div>
            </article>
          ))}
        </section>

        {/* =========================================================
            Story overview
            ========================================================= */}

        <section
          id='overview'
          className={`${panelClass} grid gap-5 p-5 lg:grid-cols-[260px_1fr]`}
        >
          <SectionIntro {...content.story} />

          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
            {content.story.items.map((item, index) => {
              const copy = 'content' in item ? item.content : item

              return (
                <article
                  key={item.id}
                  className={[
                    'min-h-48 rounded-xl border p-4 backdrop-blur-lg transition duration-300 hover:-translate-y-1',
                    index === 0 ? 'home-highlight-card' : 'home-card',
                  ].join(' ')}
                >
                  <span className='text-xs font-semibold text-violet-500'>
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h3 className='home-heading mt-3 text-lg font-semibold'>
                    {copy.title}
                  </h3>

                  <p className='home-muted mt-2 text-xs leading-5'>
                    {copy.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        {/* =========================================================
            Differentiators
            ========================================================= */}

        <section
          id={content.differentiators.title}
          className={`${panelClass} grid gap-5 p-5 lg:grid-cols-[260px_1fr]`}
        >
          <SectionIntro {...content.differentiators} />

          <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
            {content.differentiators.items.map((item, index) => (
              <article
                key={item.id}
                className='home-card rounded-xl border p-5 backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(124,58,237,.15)]'
              >
                <span
                  className={[
                    'text-3xl',
                    [
                      'text-fuchsia-500',
                      'text-cyan-500',
                      'text-lime-500',
                      'text-violet-500',
                      'text-amber-500',
                    ][index],
                  ].join(' ')}
                  aria-hidden='true'
                >
                  {item.icon}
                </span>

                <h3 className='home-heading mt-5 text-base font-semibold'>
                  {item.title}
                </h3>

                <p className='home-muted mt-2 text-xs leading-5'>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* =========================================================
            Community funding
            ========================================================= */}

        <section
          className={`${panelClass} grid gap-6 p-5 lg:grid-cols-[.72fr_1.28fr]`}
        >
          <div>
            <SectionIntro {...content.funding} />

            <ul className='mt-4 space-y-2'>
              {content.funding.benefits.map((benefit) => (
                <li key={benefit} className='home-body text-sm'>
                  <span className='mr-2 text-cyan-500'>✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            <div className='mt-5 flex flex-wrap gap-3'>
              <GradientLink {...content.funding.primaryAction} />
              <OutlineLink {...content.funding.secondaryAction} />
            </div>
          </div>

          <article className='home-video-card relative grid min-h-72 place-items-center overflow-hidden rounded-xl border backdrop-blur-xl'>
            <img
              src={content.funding.video.image}
              alt=''
              width={144}
              height={144}
              className='h-36 w-36 object-contain opacity-90 drop-shadow-[0_0_25px_#7c3aed]'
            />

            <button
              type='button'
              aria-label={content.funding.video.title}
              className='absolute grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-black/45 text-2xl text-white shadow-[0_0_28px_rgba(0,0,0,.45)] backdrop-blur-md transition hover:scale-105 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
            >
              ▶
            </button>

            <div className='absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 text-white'>
              <div>
                <p className='text-xs text-cyan-300'>
                  {content.funding.video.label}
                </p>

                <h3 className='font-semibold'>{content.funding.video.title}</h3>
              </div>

              <span className='text-sm text-slate-300'>
                {content.funding.video.duration}
              </span>
            </div>
          </article>
        </section>

        {/* =========================================================
            FAQ
            ========================================================= */}

        <section
          className={`${panelClass} grid gap-5 p-5 lg:grid-cols-[260px_1fr]`}
        >
          <div>
            <SectionIntro {...content.faq} />

            <div className='mt-5'>
              <OutlineLink {...content.faq.action} />
            </div>
          </div>

          <div className='space-y-2'>
            {content.faq.items.map((item) => (
              <details
                key={item.id}
                className='home-detail group rounded-lg border px-4 py-3 backdrop-blur-md transition'
              >
                <summary className='home-heading cursor-pointer list-none text-sm font-medium'>
                  {item.question}

                  <span className='home-muted float-right transition-transform group-open:rotate-45'>
                    +
                  </span>
                </summary>

                <p className='home-muted mt-3 border-t border-[var(--home-border)] pt-3 text-sm leading-6'>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* =========================================================
            Pricing preview
            ========================================================= */}

        <section
          className={`${panelClass} grid gap-5 p-5 lg:grid-cols-[260px_1fr]`}
        >
          <div>
            <SectionIntro {...content.pricing} />

            <div className='mt-5'>
              <OutlineLink {...content.pricing.action} />
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
            {content.pricing.tiers.map((tier) => (
              <article
                key={tier.name}
                className='home-price-card relative rounded-xl border p-4 text-center backdrop-blur-lg transition duration-300 hover:-translate-y-1'
                style={
                  {
                    '--tier-accent': tier.accent,
                    borderColor: tier.accent,
                  } as CSSProperties
                }
              >
                <p
                  className='text-xs font-semibold uppercase'
                  style={{ color: tier.accent }}
                >
                  {tier.name}
                </p>

                {'badge' in tier ? (
                  <span className='absolute top-2 right-2 rounded bg-lime-300 px-1 text-[8px] font-bold text-black'>
                    {tier.badge}
                  </span>
                ) : null}

                <p className='home-heading mt-4 text-3xl'>{tier.price}</p>

                <p className='home-muted text-[10px]'>{tier.cadence}</p>

                <p className='home-muted mt-4 text-xs leading-5'>
                  {tier.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* =========================================================
            Final CTA
            ========================================================= */}

        <section className='home-final-cta flex flex-col items-center gap-5 rounded-xl border p-5 backdrop-blur-xl sm:flex-row'>
          <div>
            <h2 className='home-heading text-xl font-semibold'>
              {content.finalCta.title}
            </h2>

            <p className='home-body text-sm'>{content.finalCta.description}</p>
          </div>

          <div className='flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row'>
            <GradientLink {...content.finalCta.primaryAction} />
            <OutlineLink {...content.finalCta.secondaryAction} />
          </div>
        </section>
      </main>
    </div>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: Readonly<{
  eyebrow: string
  title: string
  description: string
}>) {
  return (
    <header>
      <p className='text-[10px] font-semibold tracking-[0.24em] text-cyan-500 uppercase'>
        {eyebrow}
      </p>

      <h2 className='home-heading mt-2 text-2xl leading-tight font-semibold'>
        {title}
      </h2>

      <p className='home-muted mt-3 text-xs leading-5'>{description}</p>
    </header>
  )
}

function GradientLink({
  href,
  label,
}: Readonly<{ href: string; label: string }>) {
  return (
    <Link
      to={href}
      className='inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-fuchsia-600 via-violet-500 to-cyan-500 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,70,255,.22)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
    >
      {label}

      <span className='ml-3' aria-hidden='true'>
        →
      </span>
    </Link>
  )
}

function OutlineLink({
  href,
  label,
}: Readonly<{ href: string; label: string }>) {
  return (
    <Link
      to={href}
      className='home-outline-link inline-flex items-center justify-center rounded-lg border px-7 py-3 text-sm font-medium backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400'
    >
      {label}
    </Link>
  )
}

export default HomeRoute
