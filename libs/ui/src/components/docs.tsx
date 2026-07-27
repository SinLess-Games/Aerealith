import {
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/cn'

export type DocsProseProps = Readonly<ComponentPropsWithoutRef<'article'>>

/**
 * Shared content wrapper for rendered Markdown and MDX documentation.
 */
export function DocsProse({ className, ...props }: DocsProseProps) {
  return (
    <article
      {...props}
      className={cn(
        'docs-prose min-w-0 text-[var(--ae-foreground)]',
        '[&_a]:rounded-sm [&_a]:px-1 [&_a]:font-semibold',
        '[&_a]:bg-[color-mix(in_srgb,var(--ae-background)_82%,transparent)]',
        '[&_a]:text-[var(--ae-accent)] [&_a]:underline',
        '[&_a]:decoration-2 [&_a]:underline-offset-4',
        '[&_a]:transition-colors hover:[&_a]:bg-[var(--ae-background)]',
        '[&_a]:focus-visible:outline-2',
        '[&_a]:focus-visible:outline-offset-2',
        '[&_a]:focus-visible:outline-[var(--ae-accent)]',
        '[&_blockquote]:my-6 [&_blockquote]:border-l-2',
        '[&_blockquote]:border-[var(--ae-accent)]',
        '[&_blockquote]:pl-5 [&_blockquote]:italic',
        '[&_blockquote]:text-[var(--ae-foreground-muted)]',
        '[&_h1]:mt-0 [&_h1]:mb-8 [&_h1]:text-4xl',
        '[&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:tracking-tight',
        '[&_h1]:text-[var(--ae-foreground)]',
        '[&_h2]:mt-16 [&_h2]:mb-6 [&_h2]:scroll-mt-28',
        '[&_h2]:border-b [&_h2]:border-[var(--ae-border)]',
        '[&_h2]:pb-4 [&_h2]:text-2xl [&_h2]:font-semibold',
        '[&_h2]:leading-snug [&_h2]:tracking-tight',
        '[&_h3]:mt-12 [&_h3]:mb-4 [&_h3]:scroll-mt-28',
        '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug',
        '[&_h4]:mt-9 [&_h4]:mb-3 [&_h4]:scroll-mt-28',
        '[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:leading-snug',
        '[&_hr]:my-10 [&_hr]:border-[var(--ae-border)]',
        '[&_img]:rounded-xl [&_img]:border',
        '[&_img]:border-[var(--ae-border)]',
        '[&_li]:my-1.5',
        '[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7',
        '[&_p]:my-5 [&_p]:leading-7',
        '[&_strong]:font-semibold [&_strong]:text-[var(--ae-foreground)]',
        '[&_table]:w-full [&_table]:border-collapse',
        '[&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7',
        className,
      )}
      data-slot='docs-prose'
    />
  )
}

const docsCalloutVariants = cva(
  [
    'relative my-6 overflow-hidden rounded-xl border px-5 py-4',
    'text-sm leading-6',
    'before:absolute before:inset-y-0 before:left-0 before:w-1',
  ],
  {
    variants: {
      variant: {
        note: [
          'border-[var(--ae-border)]',
          'bg-[color-mix(in_srgb,var(--ae-surface)_82%,transparent)]',
          'before:bg-[var(--ae-foreground-muted)]',
        ],
        info: [
          'border-[var(--ae-cyan-30)]',
          'bg-[var(--ae-cyan-12)]',
          'before:bg-[var(--ae-accent)]',
        ],
        success: [
          'border-[rgb(var(--ae-success-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-success-rgb)_/_0.12)]',
          'before:bg-[var(--ae-success)]',
        ],
        warning: [
          'border-[rgb(var(--ae-warning-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-warning-rgb)_/_0.12)]',
          'before:bg-[var(--ae-warning)]',
        ],
        danger: [
          'border-[rgb(var(--ae-danger-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-danger-rgb)_/_0.12)]',
          'before:bg-[var(--ae-danger)]',
        ],
        security: [
          'border-[var(--ae-violet-30)]',
          'bg-[var(--ae-violet-12)]',
          'before:bg-[var(--ae-secondary)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'note',
    },
  },
)

const calloutDefaultTitles = {
  note: 'Note',
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Important',
  security: 'Security',
} as const

export interface DocsCalloutProps
  extends
    Omit<ComponentPropsWithoutRef<'aside'>, 'title'>,
    VariantProps<typeof docsCalloutVariants> {
  title?: ReactNode
}

/**
 * Documentation notice for contextual information, warnings, and security notes.
 */
export function DocsCallout({
  children,
  className,
  title,
  variant = 'note',
  ...props
}: Readonly<DocsCalloutProps>) {
  const resolvedVariant = variant ?? 'note'

  return (
    <aside
      {...props}
      className={cn(
        docsCalloutVariants({ variant: resolvedVariant }),
        className,
      )}
      data-slot='docs-callout'
      data-variant={resolvedVariant}
    >
      <div className='font-semibold text-[var(--ae-foreground)]'>
        {title ?? calloutDefaultTitles[resolvedVariant]}
      </div>

      <div className='mt-1 text-[var(--ae-foreground-muted)]'>{children}</div>
    </aside>
  )
}

export type DocsCardProps = Readonly<ComponentPropsWithoutRef<'section'>> & {
  description?: ReactNode
  footer?: ReactNode
  title?: ReactNode
}

/**
 * General-purpose documentation card.
 */
export function DocsCard({
  children,
  className,
  description,
  footer,
  title,
  ...props
}: DocsCardProps) {
  return (
    <section
      {...props}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        'border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-surface)_78%,transparent)]',
        'shadow-[0_16px_45px_rgba(0,0,0,0.12)]',
        'backdrop-blur-xl',
        className,
      )}
      data-slot='docs-card'
    >
      {(title || description) && (
        <header className='border-b border-[var(--ae-border)] px-5 py-4'>
          {title && (
            <h3 className='m-0 text-base font-semibold text-[var(--ae-foreground)]'>
              {title}
            </h3>
          )}

          {description && (
            <div className='mt-1 text-sm leading-6 text-[var(--ae-foreground-muted)]'>
              {description}
            </div>
          )}
        </header>
      )}

      <div className='px-5 py-4'>{children}</div>

      {footer && (
        <footer className='border-t border-[var(--ae-border)] px-5 py-3 text-sm text-[var(--ae-foreground-muted)]'>
          {footer}
        </footer>
      )}
    </section>
  )
}

export type DocsCardGridProps = Readonly<ComponentPropsWithoutRef<'div'>>

/**
 * Responsive grid for documentation cards.
 */
export function DocsCardGrid({ className, ...props }: DocsCardGridProps) {
  return (
    <div
      {...props}
      className={cn('my-6 grid grid-cols-1 gap-4 md:grid-cols-2', className)}
      data-slot='docs-card-grid'
    />
  )
}

export interface DocsLinkCardProps extends Omit<
  ComponentPropsWithoutRef<'a'>,
  'title'
> {
  description?: ReactNode
  icon?: ReactNode
  title: ReactNode
}

/**
 * Navigational card suitable for documentation landing pages.
 */
export function DocsLinkCard({
  children,
  className,
  description,
  icon,
  title,
  ...props
}: Readonly<DocsLinkCardProps>) {
  return (
    <a
      {...props}
      className={cn(
        'group relative flex min-h-36 flex-col rounded-2xl border p-5',
        'border-[var(--ae-border)] no-underline',
        'bg-[color-mix(in_srgb,var(--ae-surface)_76%,transparent)]',
        'shadow-[0_14px_38px_rgba(0,0,0,0.1)] backdrop-blur-xl',
        'transition duration-200',
        'hover:-translate-y-0.5',
        'hover:border-[color-mix(in_srgb,var(--ae-accent)_45%,var(--ae-border))]',
        'hover:shadow-[0_18px_46px_rgba(0,0,0,0.16)]',
        'focus-visible:outline-2 focus-visible:outline-offset-3',
        'focus-visible:outline-[var(--ae-accent)]',
        className,
      )}
      data-slot='docs-link-card'
    >
      {icon && (
        <span
          aria-hidden='true'
          className='mb-4 grid size-10 place-items-center rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] text-[var(--ae-accent)]'
        >
          {icon}
        </span>
      )}

      <span className='text-base font-semibold text-[var(--ae-foreground)]'>
        {title}
      </span>

      {description && (
        <span className='mt-2 text-sm leading-6 text-[var(--ae-foreground-muted)]'>
          {description}
        </span>
      )}

      {children && (
        <span className='mt-3 text-sm text-[var(--ae-foreground-muted)]'>
          {children}
        </span>
      )}

      <span
        aria-hidden='true'
        className='mt-auto pt-4 text-sm font-medium text-[var(--ae-accent)] transition-transform group-hover:translate-x-1'
      >
        Continue →
      </span>
    </a>
  )
}

export type DocsStepsProps = Readonly<ComponentPropsWithoutRef<'ol'>>

/**
 * Ordered documentation workflow.
 */
export function DocsSteps({ className, ...props }: DocsStepsProps) {
  return (
    <ol
      {...props}
      className={cn(
        'my-8 ml-4 border-l border-[var(--ae-border)] pl-8',
        '[&>li]:relative [&>li]:mb-8 [&>li]:list-none',
        '[&>li]:before:absolute [&>li]:before:-left-[2.72rem]',
        '[&>li]:before:top-0 [&>li]:before:grid [&>li]:before:size-7',
        '[&>li]:before:place-items-center [&>li]:before:rounded-full',
        '[&>li]:before:border [&>li]:before:border-[var(--ae-border)]',
        '[&>li]:before:bg-[var(--ae-background)]',
        '[&>li]:before:text-xs [&>li]:before:font-semibold',
        '[&>li]:before:text-[var(--ae-accent)]',
        '[&>li]:before:content-[counter(list-item)]',
        className,
      )}
      data-slot='docs-steps'
    />
  )
}

export interface DocsCodeBlockProps extends ComponentPropsWithoutRef<'pre'> {
  code?: string
  filename?: string
  language?: string
  showCopyButton?: boolean
}

/**
 * Styled code-block shell for plain code or syntax-highlighted MDX content.
 */
export function DocsCodeBlock({
  children,
  className,
  code,
  filename,
  language,
  showCopyButton = true,
  ...props
}: Readonly<DocsCodeBlockProps>) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    const value = code ?? (typeof children === 'string' ? children : undefined)

    if (!value || !navigator.clipboard) return

    await navigator.clipboard.writeText(value)
    setCopied(true)

    window.setTimeout(() => setCopied(false), 1_500)
  }

  return (
    <figure
      className={cn(
        'my-6 overflow-hidden rounded-xl border',
        'border-[var(--ae-border)] bg-[#090b12]',
        'shadow-[0_16px_45px_rgba(0,0,0,0.2)]',
        className,
      )}
      data-slot='docs-code-block'
    >
      {(filename || language || showCopyButton) && (
        <figcaption className='flex min-h-11 items-center gap-3 border-b border-white/10 px-4 text-xs text-white/65'>
          {filename && (
            <span className='truncate font-medium text-white/85'>
              {filename}
            </span>
          )}

          {language && (
            <span className='rounded-md border border-white/10 bg-white/5 px-2 py-1 uppercase'>
              {language}
            </span>
          )}

          {showCopyButton && (
            <button
              type='button'
              className='ml-auto rounded-md px-2.5 py-1.5 font-medium text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]'
              onClick={() => void copyCode()}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </figcaption>
      )}

      <pre
        {...props}
        className='m-0 overflow-x-auto p-4 text-sm leading-6 text-white'
      >
        {children ?? code}
      </pre>
    </figure>
  )
}

export type DocsInlineCodeProps = Readonly<ComponentPropsWithoutRef<'code'>>

/**
 * Inline source-code token.
 */
export function DocsInlineCode({ className, ...props }: DocsInlineCodeProps) {
  return (
    <code
      {...props}
      className={cn(
        'rounded-md border border-[var(--ae-border)]',
        'bg-[var(--ae-surface)] px-1.5 py-0.5',
        'font-mono text-[0.875em] text-[var(--ae-foreground)]',
        className,
      )}
      data-slot='docs-inline-code'
    />
  )
}

export type DocsTableProps = Readonly<ComponentPropsWithoutRef<'div'>>

/**
 * Responsive wrapper for Markdown and MDX tables.
 */
export function DocsTable({ children, className, ...props }: DocsTableProps) {
  return (
    <div
      {...props}
      className={cn(
        'my-6 overflow-x-auto rounded-xl border',
        'border-[var(--ae-border)]',
        '[&_table]:m-0 [&_table]:min-w-full',
        '[&_th]:bg-[var(--ae-surface)]',
        '[&_th]:px-4 [&_th]:py-3 [&_th]:text-left',
        '[&_th]:text-sm [&_th]:font-semibold',
        '[&_td]:border-t [&_td]:border-[var(--ae-border)]',
        '[&_td]:px-4 [&_td]:py-3 [&_td]:align-top',
        '[&_td]:text-sm [&_td]:leading-6',
        '[&_tr]:transition-colors',
        '[&_tbody_tr:hover]:bg-[color-mix(in_srgb,var(--ae-surface)_60%,transparent)]',
        className,
      )}
      data-slot='docs-table'
    >
      {children}
    </div>
  )
}

export interface DocsFigureProps extends ComponentPropsWithoutRef<'figure'> {
  caption?: ReactNode
}

/**
 * Figure wrapper for screenshots, diagrams, charts, and rendered Mermaid SVGs.
 */
export function DocsFigure({
  caption,
  children,
  className,
  ...props
}: Readonly<DocsFigureProps>) {
  return (
    <figure
      {...props}
      className={cn('my-8', className)}
      data-slot='docs-figure'
    >
      <div className='overflow-hidden rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)]'>
        {children}
      </div>

      {caption && (
        <figcaption className='mt-3 text-center text-sm leading-6 text-[var(--ae-foreground-muted)]'>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export interface DocsDetailsProps extends ComponentPropsWithoutRef<'details'> {
  summary: ReactNode
}

/**
 * Native accessible disclosure for optional documentation details.
 */
export function DocsDetails({
  children,
  className,
  summary,
  ...props
}: Readonly<DocsDetailsProps>) {
  return (
    <details
      {...props}
      className={cn(
        'group my-5 overflow-hidden rounded-xl border',
        'border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-surface)_70%,transparent)]',
        className,
      )}
      data-slot='docs-details'
    >
      <summary className='cursor-pointer list-none px-5 py-4 font-semibold text-[var(--ae-foreground)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ae-accent)]'>
        <span className='flex items-center justify-between gap-4'>
          {summary}

          <span
            aria-hidden='true'
            className='text-[var(--ae-foreground-muted)] transition-transform group-open:rotate-180'
          >
            ↓
          </span>
        </span>
      </summary>

      <div className='border-t border-[var(--ae-border)] px-5 py-4 text-[var(--ae-foreground-muted)]'>
        {children}
      </div>
    </details>
  )
}

export type DocsKeyboardKeyProps = Readonly<ComponentPropsWithoutRef<'kbd'>>

/**
 * Keyboard key indicator.
 */
export function DocsKeyboardKey({ className, ...props }: DocsKeyboardKeyProps) {
  return (
    <kbd
      {...props}
      className={cn(
        'inline-flex min-h-6 items-center rounded-md border',
        'border-[var(--ae-border)] bg-[var(--ae-surface)]',
        'px-2 font-mono text-xs font-medium',
        'text-[var(--ae-foreground)]',
        'shadow-[inset_0_-1px_0_var(--ae-border)]',
        className,
      )}
      data-slot='docs-keyboard-key'
    />
  )
}

const methodVariants = cva(
  [
    'inline-flex min-w-16 items-center justify-center rounded-md border',
    'px-2 py-1 font-mono text-xs font-bold tracking-wide',
  ],
  {
    variants: {
      method: {
        GET: [
          'border-[rgb(var(--ae-success-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-success-rgb)_/_0.12)]',
          'text-[var(--ae-success)]',
        ],
        POST: [
          'border-[var(--ae-cyan-30)]',
          'bg-[var(--ae-cyan-12)]',
          'text-[var(--ae-accent)]',
        ],
        PUT: [
          'border-[rgb(var(--ae-warning-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-warning-rgb)_/_0.12)]',
          'text-[var(--ae-warning)]',
        ],
        PATCH: [
          'border-[var(--ae-violet-30)]',
          'bg-[var(--ae-violet-12)]',
          'text-[var(--ae-secondary)]',
        ],
        DELETE: [
          'border-[rgb(var(--ae-danger-rgb)_/_0.35)]',
          'bg-[rgb(var(--ae-danger-rgb)_/_0.12)]',
          'text-[var(--ae-danger)]',
        ],
      },
    },
    defaultVariants: {
      method: 'GET',
    },
  },
)

export interface DocsApiEndpointProps
  extends ComponentPropsWithoutRef<'div'>, VariantProps<typeof methodVariants> {
  path: string
}

/**
 * HTTP method and API path display.
 */
export function DocsApiEndpoint({
  className,
  method = 'GET',
  path,
  ...props
}: Readonly<DocsApiEndpointProps>) {
  return (
    <div
      {...props}
      className={cn(
        'my-5 flex flex-wrap items-center gap-3 rounded-xl border',
        'border-[var(--ae-border)] bg-[var(--ae-surface)] p-3',
        className,
      )}
      data-slot='docs-api-endpoint'
    >
      <span className={methodVariants({ method })}>{method}</span>

      <code className='min-w-0 overflow-x-auto font-mono text-sm text-[var(--ae-foreground)]'>
        {path}
      </code>
    </div>
  )
}

export interface DocsBadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
}

/**
 * Documentation metadata badge for version, draft, beta, and status labels.
 */
export function DocsBadge({
  className,
  variant = 'neutral',
  ...props
}: Readonly<DocsBadgeProps>) {
  const variants = {
    neutral:
      'border-[var(--ae-border)] bg-[var(--ae-surface)] text-[var(--ae-foreground-muted)]',
    accent:
      'border-[var(--ae-cyan-30)] bg-[var(--ae-cyan-12)] text-[var(--ae-accent)]',
    success:
      'border-[rgb(var(--ae-success-rgb)_/_0.35)] bg-[rgb(var(--ae-success-rgb)_/_0.12)] text-[var(--ae-success)]',
    warning:
      'border-[rgb(var(--ae-warning-rgb)_/_0.35)] bg-[rgb(var(--ae-warning-rgb)_/_0.12)] text-[var(--ae-warning)]',
    danger:
      'border-[rgb(var(--ae-danger-rgb)_/_0.35)] bg-[rgb(var(--ae-danger-rgb)_/_0.12)] text-[var(--ae-danger)]',
  } as const

  return (
    <span
      {...props}
      className={cn(
        'inline-flex min-h-6 items-center rounded-full border',
        'px-2.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      data-slot='docs-badge'
      data-variant={variant}
    />
  )
}

export interface DocsTabsProps {
  defaultValue?: string
  items: readonly {
    content: ReactNode
    label: ReactNode
    value: string
  }[]
}

/**
 * Lightweight controlled tab set suitable for MDX examples.
 */
export function DocsTabs({ defaultValue, items }: Readonly<DocsTabsProps>) {
  const generatedId = useId()
  const firstValue = items[0]?.value
  const [activeValue, setActiveValue] = useState(defaultValue ?? firstValue)

  if (!firstValue || !activeValue) return null

  const activeItem =
    items.find((item) => item.value === activeValue) ?? items[0]

  return (
    <section
      className='my-6 overflow-hidden rounded-xl border border-[var(--ae-border)]'
      data-slot='docs-tabs'
    >
      <div
        className='flex overflow-x-auto border-b border-[var(--ae-border)] bg-[var(--ae-surface)] p-1'
        role='tablist'
      >
        {items.map((item) => {
          const selected = item.value === activeItem.value
          const tabId = `${generatedId}-tab-${item.value}`
          const panelId = `${generatedId}-panel-${item.value}`

          return (
            <button
              key={item.value}
              id={tabId}
              type='button'
              role='tab'
              aria-controls={panelId}
              aria-selected={selected}
              className={cn(
                'min-h-10 shrink-0 rounded-lg px-3 text-sm font-medium',
                'transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-1',
                'focus-visible:outline-[var(--ae-accent)]',
                selected
                  ? 'bg-[var(--ae-background)] text-[var(--ae-accent)] shadow-sm'
                  : 'text-[var(--ae-foreground-muted)] hover:text-[var(--ae-foreground)]',
              )}
              onClick={() => setActiveValue(item.value)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div
        id={`${generatedId}-panel-${activeItem.value}`}
        role='tabpanel'
        aria-labelledby={`${generatedId}-tab-${activeItem.value}`}
        className='p-5'
      >
        {activeItem.content}
      </div>
    </section>
  )
}
