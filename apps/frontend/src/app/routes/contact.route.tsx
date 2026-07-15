// apps/frontend/src/app/routes/contact.route.tsx

import {
  ContactDescription,
  ContactHeader,
  contactOptions,
} from '@aerealith-ai/content'

/** Public Contact page, driven by the shared content library. */
export function ContactRoute() {
  return (
    <section className='mx-auto w-full max-w-5xl px-6 py-16'>
      <header className='mx-auto max-w-3xl text-center'>
        <h1
          className='text-4xl font-bold sm:text-5xl'
          style={{ fontFamily: 'var(--ae-font-heading)' }}
        >
          {ContactHeader}
        </h1>
        <p className='mt-6 text-base leading-relaxed text-[var(--ae-foreground-muted)]'>
          {ContactDescription}
        </p>
      </header>

      <div className='mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {contactOptions.map((option) => (
          <article
            key={option.title}
            className='flex flex-col rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-6'
          >
            <h2 className='text-lg font-semibold'>{option.title}</h2>
            <p className='mt-2 flex-1 text-sm leading-relaxed text-[var(--ae-foreground-muted)]'>
              {option.description}
            </p>
            <a
              href={option.href}
              target={option.href.startsWith('http') ? '_blank' : undefined}
              rel={
                option.href.startsWith('http')
                  ? 'noopener noreferrer'
                  : undefined
              }
              className='mt-4 inline-flex min-h-9 items-center justify-center rounded-md bg-[var(--ae-primary)] px-4 text-sm font-medium text-[var(--ae-starlight)] transition-colors hover:bg-[var(--ae-primary-hover)]'
            >
              {option.buttonText}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ContactRoute
