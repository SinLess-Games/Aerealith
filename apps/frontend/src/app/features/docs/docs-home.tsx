import { useEffect } from 'react'
import { Link } from 'react-router'

import { DocsAudienceCard } from './components/docs-audience-card'
import { DocsSearch } from './components/docs-search'

export function DocsHome() {
  useEffect(() => {
    window.document.title = 'Aerealith Documentation'
  }, [])

  return (
    <div className='mx-auto max-w-6xl py-10 sm:py-16'>
      <section className='mx-auto max-w-3xl text-center'>
        <p className='text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ae-accent)]'>
          Knowledge base
        </p>
        <h1 className='mt-4 text-4xl font-semibold tracking-tight sm:text-6xl'>
          Aerealith Documentation
        </h1>
        <p className='mt-5 text-lg leading-8 text-[var(--ae-foreground-muted)]'>
          Learn how to use Aerealith, contribute to the platform, and build
          integrations from one filesystem-driven documentation portal.
        </p>
        <div className='mt-8 flex justify-center'>
          <DocsSearch searchAllAudiences />
        </div>
      </section>

      <section
        aria-label='Documentation audiences'
        className='mt-14 grid gap-6 lg:grid-cols-2'
      >
        <DocsAudienceCard
          audience='user'
          description='For people using, configuring, and administering Aerealith.'
        />
        <DocsAudienceCard
          audience='developer'
          description='For contributors, API consumers, integration developers, and operators.'
        />
      </section>

      <section className='mt-14 rounded-3xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-6 sm:p-8'>
        <h2 className='text-2xl font-semibold'>Popular starting points</h2>
        <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {[
            ['User quick start', '/documentation/user/getting-started'],
            ['Credits', '/documentation/user/credits'],
            [
              'Developer quick start',
              '/documentation/developer/getting-started',
            ],
            ['API overview', '/documentation/developer/api'],
          ].map(([label, to]) => (
            <Link
              className='rounded-xl border border-[var(--ae-border)] p-4 font-semibold transition hover:border-[var(--ae-accent)]'
              key={to}
              to={to}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
