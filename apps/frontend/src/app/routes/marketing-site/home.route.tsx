// apps/frontend/src/app/routes/home.route.tsx

import {
  HERO_DATA,
  INVESTOR_VIDEO,
  aerealithDifferentiators,
  crowdfundingSection,
  differentSection,
  faqCards,
  faqSection,
  homePageContent,
  pricingPreviewSection,
} from '@aerealith-ai/content'
import { Button, Carousel, type CarouselItem } from '@aerealith-ai/ui'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

type HomeSection = (typeof homePageContent.sections)[number]

const sectionAnchorClass =
  'rounded-full border border-[var(--ae-border)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--ae-foreground-muted)] transition-colors hover:border-[var(--ae-accent)] hover:text-[var(--ae-accent)]'

const carouselFrameClass =
  'h-[640px] overflow-hidden rounded-3xl border border-[var(--ae-border)] bg-[var(--ae-surface)]/60 shadow-[var(--ae-shadow-md)]'

const homeSectionLinks = [
  {
    href: '#overview',
    label: 'Overview',
  },
  {
    href: `#${differentSection.id}`,
    label: differentSection.eyebrow ?? differentSection.title,
  },
  {
    href: `#${crowdfundingSection.id}`,
    label: crowdfundingSection.eyebrow ?? crowdfundingSection.title,
  },
  {
    href: `#${faqSection.id}`,
    label: faqSection.eyebrow ?? faqSection.title,
  },
  {
    href: `#${pricingPreviewSection.id}`,
    label: pricingPreviewSection.eyebrow ?? pricingPreviewSection.title,
  },
] as const

/** Public landing page. */
export function HomeRoute() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  const overviewItems: CarouselItem[] = homePageContent.sections.map(
    (section) => ({
      type: 'component',
      label: sectionCardLabel(section),
      content: <SectionSummaryCard section={section} />,
    }),
  )

  const differentiatorItems: CarouselItem[] = aerealithDifferentiators.map(
    (feature) => ({
      type: 'component',
      label: feature.title,
      content: <DifferentiatorCard feature={feature} />,
    }),
  )

  const faqItems: CarouselItem[] = faqCards.map((card) => ({
    type: 'component',
    label: card.question,
    content: <FaqCard card={card} />,
  }))

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 600)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className='space-y-24 px-6 py-16 sm:py-20'>
      <section
        id='hero'
        className='mx-auto flex w-full max-w-6xl flex-col items-center text-center'
      >
        <p className='text-sm font-semibold uppercase tracking-[0.28em] text-[var(--ae-accent)]'>
          {homePageContent.sections[0]?.eyebrow ?? 'Aerealith AI'}
        </p>
        <h1
          className='mt-4 max-w-5xl text-4xl font-bold text-balance sm:text-5xl lg:text-6xl'
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          {HERO_DATA.title}
        </h1>
        <p className='mt-6 max-w-3xl text-base leading-relaxed text-[var(--ae-foreground-muted)] sm:text-lg'>
          {HERO_DATA.subtitle}
        </p>
        <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
          <Link to='/sign-up'>
            <Button size='lg'>Get started</Button>
          </Link>
          <Link to='/pricing'>
            <Button size='lg' variant='outline'>
              See plans
            </Button>
          </Link>
        </div>
        <div className='mt-10 flex flex-wrap justify-center gap-2'>
          {homeSectionLinks.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className={sectionAnchorClass}
            >
              {section.label}
            </a>
          ))}
        </div>
      </section>

      <section id='overview' className='mx-auto w-full max-w-6xl'>
        <div className='grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start'>
          <SectionIntro
            eyebrow='At a glance'
            title='The full home story in one carousel'
            description='Explore the core home sections in sequence: the hero, the platform overview, the product preview, crowdfunding, and pricing.'
          />
          <Carousel
            autoScroll
            autoScrollInterval={6_500}
            className={carouselFrameClass}
            items={overviewItems}
            pauseOnInteraction
            showControls
            showIndicators
          />
        </div>
      </section>

      <section id={differentSection.id} className='mx-auto w-full max-w-6xl'>
        <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start'>
          <Carousel
            className={carouselFrameClass}
            items={differentiatorItems}
            pauseOnInteraction
            showControls
            showIndicators
          />

          <div>
            <SectionIntro
              eyebrow={differentSection.eyebrow}
              title={differentSection.title}
              description={differentSection.description}
            />
            {differentSection.body ? (
              <p className='mt-4 max-w-4xl text-sm leading-relaxed text-[var(--ae-foreground-muted)] sm:text-base'>
                {differentSection.body}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section id={crowdfundingSection.id} className='mx-auto w-full max-w-6xl'>
        <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start'>
          <div className='space-y-8'>
            <SectionIntro
              eyebrow={crowdfundingSection.eyebrow}
              title={crowdfundingSection.title}
              description={crowdfundingSection.description}
            />

            <div className='space-y-5'>
              {crowdfundingSection.body ? (
                <p className='text-base leading-relaxed text-[var(--ae-foreground-muted)]'>
                  {crowdfundingSection.body}
                </p>
              ) : null}

              <div className='flex flex-wrap gap-4'>
                <Link to='/contact'>
                  <Button size='lg'>Support the build</Button>
                </Link>
                <Link to='/pricing'>
                  <Button size='lg' variant='outline'>
                    Review pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <article className='rounded-3xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-5 shadow-[var(--ae-shadow-md)]'>
            <video
              className='aspect-video w-full rounded-2xl bg-black object-cover'
              controls
              playsInline
              preload='metadata'
              src={INVESTOR_VIDEO.src}
            >
              <track
                kind='captions'
                label='English'
                src='/captions/aerealith-investor-video.vtt'
                srcLang='en'
                default
              />
            </video>
            <div className='mt-5 space-y-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ae-accent)]'>
                {INVESTOR_VIDEO.eyebrow}
              </p>
              <h3
                className='text-2xl font-bold'
                style={{ fontFamily: 'var(--ae-font-heading)' }}
              >
                {INVESTOR_VIDEO.title}
              </h3>
              <p className='text-sm leading-relaxed text-[var(--ae-foreground-muted)]'>
                {INVESTOR_VIDEO.body}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id={faqSection.id} className='mx-auto w-full max-w-6xl'>
        <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start'>
          <Carousel
            autoScroll={false}
            className={carouselFrameClass}
            items={faqItems}
            pauseOnInteraction
            showControls
            showIndicators
          />

          <div>
            <SectionIntro
              eyebrow={faqSection.eyebrow}
              title={faqSection.title}
              description={faqSection.description}
            />
            {faqSection.body ? (
              <p className='mt-4 max-w-4xl text-sm leading-relaxed text-[var(--ae-foreground-muted)] sm:text-base'>
                {faqSection.body}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <button
        aria-label='Back to top'
        className={[
          'fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--ae-border)] bg-[var(--ae-surface)] text-[var(--ae-foreground)] shadow-[var(--ae-shadow-md)] transition-all duration-200',
          showBackToTop
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0',
        ].join(' ')}
        onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
        type='button'
      >
        <svg
          aria-hidden='true'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth='2'
          className='h-5 w-5'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M5 14l7-7 7 7'
          />
        </svg>
      </button>
    </div>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <header className='max-w-3xl'>
      {eyebrow ? (
        <p className='text-sm font-semibold uppercase tracking-[0.24em] text-[var(--ae-accent)]'>
          {eyebrow}
        </p>
      ) : null}
      <h2
        className='mt-3 text-3xl font-bold sm:text-4xl'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {title}
      </h2>
      {description ? (
        <p className='mt-4 text-base leading-relaxed text-[var(--ae-foreground-muted)]'>
          {description}
        </p>
      ) : null}
    </header>
  )
}

function SectionSummaryCard({ section }: { section: HomeSection }) {
  const { title, description, eyebrow, body } = getSectionCopy(section)

  return (
    <article className='flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--ae-border-subtle)] bg-[var(--ae-surface)] px-6 py-6 pb-28 sm:px-12 sm:pb-32'>
      <div className='space-y-5 pr-10 sm:pr-16'>
        <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ae-accent)]'>
          {sectionTag(section)}
        </p>
        {eyebrow ? (
          <p className='text-sm font-semibold text-[var(--ae-foreground-muted)]'>
            {eyebrow}
          </p>
        ) : null}
        <h3
          className='text-2xl font-bold'
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          {title}
        </h3>
        {description ? (
          <p className='text-sm leading-relaxed text-[var(--ae-foreground-muted)]'>
            {description}
          </p>
        ) : null}
        {body ? (
          <p
            className='max-w-[42rem] overflow-hidden text-sm leading-relaxed text-[var(--ae-foreground-subtle)]'
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 5,
            }}
          >
            {body}
          </p>
        ) : null}
      </div>
      <a
        href={`#${section.id}`}
        className='mt-6 inline-flex items-center text-sm font-semibold text-[var(--ae-accent)] hover:underline'
      >
        Explore this section
      </a>
    </article>
  )
}

function DifferentiatorCard({
  feature,
}: {
  feature: (typeof aerealithDifferentiators)[number]
}) {
  return (
    <article className='flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--ae-border-subtle)] bg-[var(--ae-surface)] px-6 py-6 pb-24 sm:px-12 sm:pb-28'>
      <p className='text-3xl' aria-hidden='true'>
        {feature.icon}
      </p>
      <h3
        className='mt-4 text-2xl font-bold'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {feature.title}
      </h3>
      <p
        className='mt-4 max-w-[42rem] overflow-hidden text-sm leading-relaxed text-[var(--ae-foreground-muted)]'
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 5,
        }}
      >
        {feature.description}
      </p>
    </article>
  )
}

function FaqCard({ card }: { card: (typeof faqCards)[number] }) {
  return (
    <article className='flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--ae-border-subtle)] bg-[var(--ae-surface)] px-6 py-6 pb-24 sm:px-12 sm:pb-28'>
      <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ae-accent)]'>
        {card.tag}
      </p>
      <h3
        className='mt-4 text-2xl font-bold'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {card.question}
      </h3>
      <p className='mt-4 text-sm leading-relaxed text-[var(--ae-foreground-muted)]'>
        {card.answer}
      </p>
    </article>
  )
}

function getSectionCopy(section: HomeSection) {
  if (section.component === 'marketing-section') {
    const marketingSection = section as Extract<
      HomeSection,
      { component: 'marketing-section' }
    > & {
      body?: string
    }

    return {
      eyebrow: marketingSection.eyebrow,
      title: marketingSection.title,
      description: marketingSection.description,
      body: marketingSection.body,
    }
  }

  return {
    eyebrow: section.content.eyebrow,
    title: section.content.title ?? section.id,
    description: section.content.description,
    body: section.content.body,
  }
}

function sectionTag(section: HomeSection) {
  const copy = getSectionCopy(section)

  return copy.eyebrow ?? copy.title
}

function sectionCardLabel(section: HomeSection) {
  return getSectionCopy(section).title
}

export default HomeRoute
