// apps/frontend/src/app/routes/pricing.route.tsx

import { pricingPreviewSection } from '@aerealith-ai/content'
import { Button } from '@aerealith-ai/ui'
import { Link } from 'react-router'

/** Public Pricing preview page, driven by the shared content library. */
export function PricingRoute() {
  const { eyebrow, title, description, body } = pricingPreviewSection

  return (
    <section className='mx-auto w-full max-w-3xl px-6 py-16 text-center'>
      {eyebrow ? (
        <p className='text-sm font-semibold tracking-wide text-[var(--ae-accent)] uppercase'>
          {eyebrow}
        </p>
      ) : null}
      <h1
        className='mt-3 text-4xl font-bold sm:text-5xl'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {title}
      </h1>
      {description ? (
        <p className='mt-6 text-base leading-relaxed text-[var(--ae-foreground-muted)]'>
          {description}
        </p>
      ) : null}
      {body ? (
        <p className='mt-4 text-sm leading-relaxed text-[var(--ae-foreground-subtle)]'>
          {body}
        </p>
      ) : null}

      <div className='mt-10 flex justify-center'>
        <Link to='/sign-up'>
          <Button size='lg'>Get started free</Button>
        </Link>
      </div>
    </section>
  )
}

export default PricingRoute
