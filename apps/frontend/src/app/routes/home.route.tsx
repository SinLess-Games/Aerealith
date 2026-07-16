// apps/frontend/src/app/routes/home.route.tsx

import { HERO_DATA } from '@aerealith-ai/content'
import { Button } from '@aerealith-ai/ui'

/** Public landing page. */
export function HomeRoute() {
  return (
    <section className='mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-20 text-center'>
      <span className='mb-4 rounded-full border border-[var(--ae-border)] px-4 py-1.5 text-sm'>
        Trust-first · human-approved · revocable
      </span>
      <h1
        className='max-w-3xl text-4xl font-bold text-balance sm:text-5xl'
        style={{ fontFamily: 'var(--ae-font-heading)' }}
      >
        {HERO_DATA.title}
      </h1>
      <p className='mt-6 max-w-2xl text-base leading-relaxed sm:text-lg'>
        {HERO_DATA.subtitle}
      </p>
      <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
        <Button size='lg'>Get started</Button>
        <Button size='lg' variant='outline'>
          See how it works
        </Button>
      </div>
    </section>
  )
}

export default HomeRoute
