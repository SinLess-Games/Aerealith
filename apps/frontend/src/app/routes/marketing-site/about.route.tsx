// apps/frontend/src/app/routes/about.route.tsx

import { aboutPageContent } from '@aerealith-ai/content'
import type { CSSProperties } from 'react'
import { Link } from 'react-router'

interface FeatureIconProps {
  index: number
  accent: string
}

interface ArrowIconProps {
  className?: string
}

/**
 * Icons shown beside the three short hero highlights.
 */
function HighlightIcon({ index }: { index: number }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }

  if (index === 0) {
    return (
      <svg {...commonProps}>
        <path d='M12 3 4.5 6v5.2c0 4.6 3.1 8.1 7.5 9.8 4.4-1.7 7.5-5.2 7.5-9.8V6L12 3Z' />
        <path d='m8.8 12 2.1 2.1 4.4-4.6' />
      </svg>
    )
  }

  if (index === 1) {
    return (
      <svg {...commonProps}>
        <rect x='5' y='10' width='14' height='11' rx='2' />
        <path d='M8 10V7a4 4 0 0 1 8 0v3' />
        <path d='M12 14v3' />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <rect x='3' y='3' width='7' height='7' rx='1.5' />
      <rect x='14' y='3' width='7' height='7' rx='1.5' />
      <rect x='3' y='14' width='7' height='7' rx='1.5' />
      <rect x='14' y='14' width='7' height='7' rx='1.5' />
    </svg>
  )
}

/**
 * Each feature has its own icon.
 *
 * The icon color comes from the feature's accent value, allowing the icon,
 * border, background tint, and card glow to stay visually synchronized.
 */
function FeatureIcon({ index, accent }: FeatureIconProps) {
  const commonProps = {
    'aria-hidden': true,
    className: 'h-9 w-9',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }

  const icons = [
    // 01 — Unified command center
    <svg key='command-center' {...commonProps}>
      <rect x='3' y='4' width='18' height='13' rx='2' />
      <path d='M8 21h8' />
      <path d='M12 17v4' />
      <path d='M7 8h4' />
      <path d='M7 12h2' />
      <path d='M14 8h3' />
      <path d='M13 12h4' />
    </svg>,

    // 02 — Trust first
    <svg key='trust' {...commonProps}>
      <path d='M12 3 4.5 6v5.2c0 4.6 3.1 8.1 7.5 9.8 4.4-1.7 7.5-5.2 7.5-9.8V6L12 3Z' />
      <path d='m8.8 12 2.1 2.1 4.4-4.6' />
    </svg>,

    // 03 — Modular design
    <svg key='modules' {...commonProps}>
      <rect x='3' y='3' width='7' height='7' rx='1.5' />
      <rect x='14' y='3' width='7' height='7' rx='1.5' />
      <rect x='3' y='14' width='7' height='7' rx='1.5' />
      <rect x='14' y='14' width='7' height='7' rx='1.5' />
    </svg>,

    // 04 — Smart automations
    <svg key='automations' {...commonProps}>
      <path d='M13.2 2 5 13h6l-.8 9L19 10h-6l.2-8Z' />
    </svg>,

    // 05 — Scoped integrations
    <svg key='integrations' {...commonProps}>
      <path d='M8 8V5a2 2 0 0 1 2-2h1' />
      <path d='M16 8V5a2 2 0 0 0-2-2h-1' />
      <path d='M8 16v3a2 2 0 0 0 2 2h1' />
      <path d='M16 16v3a2 2 0 0 1-2 2h-1' />
      <circle cx='7' cy='12' r='3' />
      <circle cx='17' cy='12' r='3' />
      <path d='M10 12h4' />
    </svg>,

    // 06 — Responsible AI
    <svg key='responsible-ai' {...commonProps}>
      <path d='M9.5 4.5A3.5 3.5 0 0 0 6 8v.4A3.5 3.5 0 0 0 4.5 15a3.5 3.5 0 0 0 5 3.2' />
      <path d='M14.5 4.5A3.5 3.5 0 0 1 18 8v.4a3.5 3.5 0 0 1 1.5 6.6 3.5 3.5 0 0 1-5 3.2' />
      <path d='M9.5 4.5v15' />
      <path d='M14.5 4.5v15' />
      <path d='M9.5 9H7.8' />
      <path d='M14.5 9h1.7' />
      <path d='M9.5 15H7.8' />
      <path d='M14.5 15h1.7' />
    </svg>,

    // 07 — Discord
    <svg key='discord' {...commonProps}>
      <path d='M8.2 7.2A10 10 0 0 1 12 6.5a10 10 0 0 1 3.8.7' />
      <path d='M7.3 5.3 5.4 7a14.3 14.3 0 0 0-2 8.2 9.7 9.7 0 0 0 4.8 2.4l1.2-1.7' />
      <path d='M16.7 5.3 18.6 7a14.3 14.3 0 0 1 2 8.2 9.7 9.7 0 0 1-4.8 2.4l-1.2-1.7' />
      <path d='M8.5 18.1a8 8 0 0 0 7 0' />
      <circle cx='9' cy='13' r='1' fill='currentColor' stroke='none' />
      <circle cx='15' cy='13' r='1' fill='currentColor' stroke='none' />
    </svg>,

    // 08 — Analytics
    <svg key='analytics' {...commonProps}>
      <path d='M4 20V10' />
      <path d='M10 20V14' />
      <path d='M16 20V8' />
      <path d='M22 20V4' />
      <path d='m3 8 6-4 6 3 7-5' />
    </svg>,

    // 09 — Long-term growth
    <svg key='growth' {...commonProps}>
      <path d='M14.5 5.5c3.2-1.9 5.5-1.5 6.5-1.5 0 1-.4 3.3-2.4 6.5l-4.1 4.1-5.1-5.1 5.1-4Z' />
      <path d='m9.5 9.5-3.7.5-2.3 2.3 5.2 1.1' />
      <path d='m14.5 14.5-.5 3.7-2.3 2.3-1.1-5.2' />
      <circle cx='16.5' cy='8.5' r='1.5' />
      <path d='M5 19c1.8-.1 3.2-1.5 3.3-3.3C6.5 15.8 5.1 17.2 5 19Z' />
    </svg>,
  ]

  return (
    <div
      className='feature-icon grid h-16 w-16 shrink-0 place-items-center rounded-2xl border transition duration-300 group-hover:scale-105'
      style={
        {
          '--feature-accent': accent,
        } as CSSProperties
      }
    >
      {icons[index] ?? icons[0]}
    </div>
  )
}

function ArrowIcon({ className = 'h-5 w-5' }: ArrowIconProps) {
  return (
    <svg
      aria-hidden='true'
      className={className}
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <path d='M5 12h14' />
      <path d='m13 6 6 6-6 6' />
    </svg>
  )
}

export function AboutRoute() {
  const {
    brandImage,
    cta,
    description,
    eyebrow,
    features,
    heading,
    highlightedHeading,
    highlights,
  } = aboutPageContent

  return (
    <main className='about-route relative isolate flex-1 overflow-hidden bg-transparent'>
      <style>{`
        :root[data-theme='light'] .about-route {
          --about-heading: #0f172a;
          --about-body: #334155;
          --about-muted: #64748b;
          --about-soft: #475569;

          --about-panel: rgba(255, 255, 255, 0.64);
          --about-panel-hover: rgba(255, 255, 255, 0.82);
          --about-panel-strong: rgba(255, 255, 255, 0.76);

          --about-panel-border: rgba(71, 85, 105, 0.2);
          --about-button: rgba(255, 255, 255, 0.58);
          --about-button-hover: rgba(255, 255, 255, 0.9);

          --about-shadow: rgba(15, 23, 42, 0.13);
          --about-inset: rgba(255, 255, 255, 0.7);

          --about-hero-blue: rgba(14, 165, 233, 0.13);
          --about-hero-purple: rgba(168, 85, 247, 0.1);

          --about-icon-base: rgba(255, 255, 255, 0.5);
          --about-icon-end: rgba(241, 245, 249, 0.72);
        }

        :root[data-theme='dark'] .about-route {
          --about-heading: #f8fafc;
          --about-body: #cbd5e1;
          --about-muted: #94a3b8;
          --about-soft: #cbd5e1;

          --about-panel: rgba(2, 6, 23, 0.5);
          --about-panel-hover: rgba(2, 6, 23, 0.7);
          --about-panel-strong: rgba(2, 6, 23, 0.62);

          --about-panel-border: rgba(196, 181, 253, 0.2);
          --about-button: rgba(2, 6, 23, 0.4);
          --about-button-hover: rgba(30, 41, 59, 0.72);

          --about-shadow: rgba(0, 0, 0, 0.34);
          --about-inset: rgba(255, 255, 255, 0.025);

          --about-hero-blue: rgba(37, 99, 235, 0.13);
          --about-hero-purple: rgba(126, 34, 206, 0.11);

          --about-icon-base: rgba(2, 6, 23, 0.48);
          --about-icon-end: rgba(15, 23, 42, 0.76);
        }

        .about-route {
          color: var(--about-heading);
        }

        .about-route .about-hero-lighting {
          background:
            radial-gradient(
              circle at 72% 28%,
              var(--about-hero-blue),
              transparent 34%
            ),
            radial-gradient(
              circle at 28% 70%,
              var(--about-hero-purple),
              transparent 38%
            );
        }

        .about-route .about-heading {
          color: var(--about-heading);
        }

        .about-route .about-body {
          color: var(--about-body);
        }

        .about-route .about-muted {
          color: var(--about-muted);
        }

        .about-route .about-soft {
          color: var(--about-soft);
        }

        .about-route .brand-hologram {
          isolation: isolate;
        }

        .about-route .brand-mark {
          width: clamp(18rem, 32vw, 28rem);
          height: clamp(18rem, 32vw, 28rem);
          pointer-events: none;
          object-fit: contain;
          transform: translateY(-0.5rem);
          animation: brand-mark-float 4s ease-in-out infinite;
          filter:
            drop-shadow(0 0 18px rgba(236, 72, 153, 0.72))
            drop-shadow(0 0 34px rgba(59, 130, 246, 0.7))
            drop-shadow(0 0 54px rgba(6, 182, 212, 0.38));
        }

        @keyframes brand-mark-float {
          0%,
          100% {
            transform: translateY(-0.5rem);
          }

          50% {
            transform: translateY(-0.9rem);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-route .brand-mark {
            animation: none;
          }
        }

        .about-route .feature-card {
          border-color: color-mix(
            in srgb,
            var(--feature-accent) 34%,
            var(--about-panel-border)
          );

          background:
            radial-gradient(
              circle at 15% 18%,
              color-mix(
                in srgb,
                var(--feature-accent) 12%,
                transparent
              ),
              transparent 43%
            ),
            var(--about-panel);

          box-shadow:
            0 16px 48px var(--about-shadow),
            0 0 18px
              color-mix(
                in srgb,
                var(--feature-accent) 12%,
                transparent
              ),
            inset 0 1px 0 var(--about-inset);
        }

        .about-route .feature-card:hover,
        .about-route .feature-card:focus-within {
          border-color: color-mix(
            in srgb,
            var(--feature-accent) 70%,
            transparent
          );

          background:
            radial-gradient(
              circle at 15% 18%,
              color-mix(
                in srgb,
                var(--feature-accent) 18%,
                transparent
              ),
              transparent 48%
            ),
            var(--about-panel-hover);

          box-shadow:
            0 22px 64px var(--about-shadow),
            0 0 34px
              color-mix(
                in srgb,
                var(--feature-accent) 34%,
                transparent
              ),
            0 0 70px
              color-mix(
                in srgb,
                var(--feature-accent) 13%,
                transparent
              ),
            inset 0 1px 0 var(--about-inset);
        }

        .about-route .feature-icon {
          color: var(--feature-accent);

          border-color: color-mix(
            in srgb,
            var(--feature-accent) 48%,
            transparent
          );

          background: linear-gradient(
            145deg,
            color-mix(
              in srgb,
              var(--feature-accent) 19%,
              var(--about-icon-base)
            ),
            var(--about-icon-end)
          );

          box-shadow:
            inset 0 0 24px
              color-mix(
                in srgb,
                var(--feature-accent) 15%,
                transparent
              ),
            0 0 22px
              color-mix(
                in srgb,
                var(--feature-accent) 17%,
                transparent
              );
        }

        .about-route .feature-card:hover .feature-icon,
        .about-route .feature-card:focus-within .feature-icon {
          box-shadow:
            inset 0 0 28px
              color-mix(
                in srgb,
                var(--feature-accent) 22%,
                transparent
              ),
            0 0 30px
              color-mix(
                in srgb,
                var(--feature-accent) 38%,
                transparent
              );
        }

        .about-route .feature-number {
          color: var(--feature-accent);

          text-shadow:
            0 0 12px
              color-mix(
                in srgb,
                var(--feature-accent) 58%,
                transparent
              );
        }

        .about-route .feature-arrow {
          color: var(--about-soft);

          border-color: color-mix(
            in srgb,
            var(--feature-accent) 28%,
            var(--about-panel-border)
          );

          background: var(--about-button);

          box-shadow:
            inset 0 0 12px
              color-mix(
                in srgb,
                var(--feature-accent) 10%,
                transparent
              );
        }

        .about-route .feature-card:hover .feature-arrow,
        .about-route .feature-card:focus-within .feature-arrow {
          color: var(--feature-accent);

          border-color: color-mix(
            in srgb,
            var(--feature-accent) 62%,
            transparent
          );

          background: var(--about-button-hover);

          box-shadow:
            0 0 20px
              color-mix(
                in srgb,
                var(--feature-accent) 28%,
                transparent
              );
        }

        .about-route .feature-edge {
          background: linear-gradient(
            90deg,
            transparent,
            var(--feature-accent),
            transparent
          );

          box-shadow:
            0 0 14px
              color-mix(
                in srgb,
                var(--feature-accent) 72%,
                transparent
              );
        }

        .about-route .cta-panel {
          border-color: var(--about-panel-border);
          background: var(--about-panel-strong);

          box-shadow:
            0 16px 50px var(--about-shadow),
            inset 0 1px 0 var(--about-inset);
        }

        .about-route .secondary-cta {
          color: var(--about-heading);
          border-color: var(--about-panel-border);
          background: var(--about-button);
        }

        .about-route .secondary-cta:hover {
          background: var(--about-button-hover);
          border-color: rgba(139, 92, 246, 0.52);
        }
      `}</style>

      {/* Decorative lighting; the route background remains transparent. */}
      <div
        aria-hidden='true'
        className='about-hero-lighting pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px]'
      />

      <section className='mx-auto w-full max-w-[1440px] px-5 pt-10 pb-10 sm:px-8 lg:px-12 lg:pt-14'>
        {/* Hero */}
        <div className='grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14'>
          <div className='max-w-3xl'>
            <p className='mb-5 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-cyan-500 uppercase'>
              <span className='h-px w-6 bg-gradient-to-r from-violet-500 to-cyan-400' />
              {eyebrow}
            </p>

            <h1 className='about-heading max-w-3xl text-4xl leading-[1.03] font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl xl:text-[4.35rem]'>
              {heading}

              <span className='mt-1 block bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent'>
                {highlightedHeading}
              </span>
            </h1>

            <p className='about-body mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8'>
              {description}
            </p>

            <div className='mt-8 flex flex-wrap gap-x-8 gap-y-4'>
              {highlights.map((label, index) => (
                <div
                  key={label}
                  className='about-soft flex items-center gap-3 text-sm font-medium'
                >
                  <span
                    className={[
                      'grid h-9 w-9 place-items-center rounded-xl border shadow-sm backdrop-blur-sm',
                      index === 2
                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500'
                        : 'border-violet-500/30 bg-violet-500/10 text-violet-500',
                    ].join(' ')}
                  >
                    <HighlightIcon index={index} />
                  </span>

                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Holographic brand mark */}
          <div className='brand-hologram relative mx-auto grid min-h-[390px] w-full max-w-2xl place-items-center lg:min-h-[450px]'>
            {/* Outer geometric hologram frame. */}
            <div
              aria-hidden='true'
              className='absolute h-80 w-80 rotate-45 rounded-[4rem] border border-violet-500/20 bg-violet-500/5 shadow-[0_0_100px_rgba(80,70,255,0.24)] sm:h-[23rem] sm:w-[23rem]'
            />

            {/* Inner circular hologram field. */}
            <div
              aria-hidden='true'
              className='absolute h-72 w-72 rounded-full border border-cyan-500/20 bg-blue-500/5 shadow-[0_0_110px_rgba(14,165,233,0.28)] sm:h-80 sm:w-80'
            />

            {/* Secondary orbital ring. */}
            <div
              aria-hidden='true'
              className='absolute h-[19rem] w-[12rem] rotate-[28deg] rounded-[50%] border border-cyan-400/15 sm:h-[23rem] sm:w-[15rem]'
            />

            {/* Opposing orbital ring. */}
            <div
              aria-hidden='true'
              className='absolute h-[19rem] w-[12rem] -rotate-[28deg] rounded-[50%] border border-violet-400/15 sm:h-[23rem] sm:w-[15rem]'
            />

            {/* Holographic projection platform. */}
            <div
              aria-hidden='true'
              className='absolute bottom-5 h-20 w-[92%] max-w-[34rem] rounded-[100%] border border-cyan-400/50 bg-blue-500/10 shadow-[0_0_42px_rgba(14,165,233,0.8),inset_0_0_36px_rgba(124,58,237,0.72)]'
            />

            {/* Inner platform ring. */}
            <div
              aria-hidden='true'
              className='absolute bottom-9 h-11 w-[72%] max-w-[27rem] rounded-[100%] border border-violet-400/40 bg-violet-500/5 shadow-[0_0_24px_rgba(168,85,247,0.58)]'
            />

            {/* Larger brand mark with transparent-image padding compensated. */}
            <img
              src={brandImage.src}
              alt={brandImage.alt}
              width={384}
              height={384}
              className='brand-mark relative z-10'
            />
          </div>
        </div>

        {/* Nine feature cards */}
        <div className='mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {features.map(({ title, description, accent }, index) => (
            <article
              key={title}
              className='feature-card group relative flex min-h-40 items-center gap-4 overflow-hidden rounded-2xl border p-5 backdrop-blur-md transition duration-300 hover:-translate-y-1'
              style={
                {
                  '--feature-accent': accent,
                } as CSSProperties
              }
            >
              {/* Accent-colored light spill behind the icon. */}
              <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-0 opacity-75 transition-opacity duration-300 group-hover:opacity-100'
                style={{
                  background: `radial-gradient(
                    circle at 15% 22%,
                    color-mix(in srgb, ${accent} 18%, transparent),
                    transparent 43%
                  )`,
                }}
              />

              {/* Accent-colored glowing lower edge. */}
              <div
                aria-hidden='true'
                className='feature-edge pointer-events-none absolute inset-x-8 bottom-0 h-px opacity-60 transition-opacity duration-300 group-hover:opacity-100'
              />

              <FeatureIcon index={index} accent={accent} />

              <div className='relative min-w-0 flex-1 self-stretch py-1'>
                <div className='flex items-start gap-3'>
                  <span className='feature-number pt-0.5 text-sm font-semibold'>
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h2 className='about-heading text-base leading-6 font-semibold sm:text-lg'>
                    {title}
                  </h2>
                </div>

                <p className='about-muted mt-2 text-sm leading-6'>
                  {description}
                </p>
              </div>

              <span
                aria-hidden='true'
                className='feature-arrow relative grid h-10 w-10 shrink-0 place-items-center rounded-full border transition duration-300 group-hover:translate-x-1'
              >
                <ArrowIcon />
              </span>
            </article>
          ))}
        </div>

        {/* Closing call to action */}
        <div className='cta-panel mt-5 flex flex-col items-center gap-5 rounded-2xl border p-5 backdrop-blur-md sm:flex-row sm:p-6'>
          <div className='grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-violet-500/30 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.15)]'>
            <img
              src={brandImage.src}
              alt=''
              width={52}
              height={52}
              className='h-12 w-12 object-contain drop-shadow-[0_0_12px_rgba(124,58,237,0.65)]'
            />
          </div>

          <div className='text-center sm:text-left'>
            <p className='about-heading text-base font-semibold'>
              {cta.heading}
            </p>

            <p className='about-muted mt-1 text-sm'>{cta.description}</p>
          </div>

          <div className='flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row'>
            <Link
              to={cta.secondaryHref}
              className='secondary-cta inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border px-8 py-3 text-center text-sm font-medium transition'
            >
              {cta.secondaryLabel}
              <ArrowIcon />
            </Link>

            <Link
              to={cta.primaryHref}
              className='inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-10 py-3 text-center text-sm font-semibold text-white shadow-[0_0_28px_rgba(37,99,235,0.24)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'
            >
              {cta.primaryLabel}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AboutRoute
