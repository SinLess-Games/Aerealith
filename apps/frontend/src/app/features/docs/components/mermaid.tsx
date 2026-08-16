import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'

import { cn } from '@aerealith-ai/ui'

type MermaidTheme = 'light' | 'dark'

type RenderStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface MermaidProps extends Omit<
  ComponentPropsWithoutRef<'figure'>,
  'title'
> {
  /**
   * Mermaid diagram source.
   *
   * Fumadocs supplies this automatically when `remarkMdxMermaid` transforms a
   * fenced `mermaid` code block into an MDX component.
   */
  chart: string

  /**
   * Accessible diagram title and visible toolbar label.
   */
  title?: string

  /**
   * Accessible description of the diagram.
   */
  description?: string

  /**
   * Optional caption shown below the rendered diagram.
   */
  caption?: ReactNode

  /**
   * Show the source-copy and SVG-download controls.
   */
  showToolbar?: boolean

  /**
   * Show the Mermaid source when rendering fails.
   */
  showSourceOnError?: boolean
}

/**
 * Mermaid keeps global rendering configuration, so diagrams are rendered
 * sequentially to prevent one diagram's theme configuration from racing with
 * another diagram.
 */
let mermaidRenderQueue: Promise<void> = Promise.resolve()

function queueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const result = mermaidRenderQueue.then(task, task)

  mermaidRenderQueue = result.then(
    () => undefined,
    () => undefined,
  )

  return result
}

/**
 * Renders Mermaid diagrams inside Aerealith documentation.
 *
 * Features:
 *
 * - Lazy Mermaid loading
 * - Aerealith light/dark theme integration
 * - Strict Mermaid security mode
 * - Accessible SVG output
 * - Copy-source support
 * - SVG downloads
 * - Graceful syntax-error fallback
 */
export function Mermaid({
  caption,
  chart,
  className,
  description,
  showSourceOnError = true,
  showToolbar = true,
  title = 'Diagram',
  ...props
}: Readonly<MermaidProps>) {
  const reactId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const renderCountRef = useRef(0)

  const [theme, setTheme] = useState<MermaidTheme>(() => getResolvedTheme())
  const [status, setStatus] = useState<RenderStatus>('idle')
  const [error, setError] = useState<string>()
  const [copied, setCopied] = useState(false)

  const diagramId = useMemo(
    () => `aerealith-mermaid-${sanitizeId(reactId)}`,
    [reactId],
  )

  const normalizedChart = useMemo(
    () => chart.replaceAll(String.raw`\n`, '\n').trim(),
    [chart],
  )

  useEffect(() => {
    const updateTheme = () => {
      setTheme(getResolvedTheme())
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)

    observer.observe(document.documentElement, {
      attributeFilter: ['class', 'data-theme'],
      attributes: true,
      subtree: true,
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    mediaQuery.addEventListener('change', updateTheme)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const container = containerRef.current

    if (!container || normalizedChart.length === 0) {
      setStatus('error')
      setError('The Mermaid diagram does not contain any source.')
      return
    }

    setStatus('loading')
    setError(undefined)
    container.replaceChildren()

    const renderDiagram = async () => {
      try {
        await queueMermaidRender(async () => {
          const { default: mermaid } = await import('mermaid')

          if (cancelled) return

          const themeVariables = getThemeVariables(theme)

          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: 'base',
            fontFamily: themeVariables.fontFamily,
            themeVariables,
          })

          await mermaid.parse(normalizedChart)

          if (cancelled) return

          renderCountRef.current += 1

          const renderId = `${diagramId}-${renderCountRef.current}`

          const { bindFunctions, svg } = await mermaid.render(
            renderId,
            normalizedChart,
          )

          if (cancelled || !containerRef.current) return

          const svgElement = parseMermaidSvg(svg)

          applySvgAccessibility(svgElement, {
            description,
            title,
          })

          const importedSvg = document.importNode(svgElement, true)

          containerRef.current.replaceChildren(importedSvg)
          bindFunctions?.(containerRef.current)
        })

        if (!cancelled) {
          setStatus('ready')
        }
      } catch (caughtError) {
        if (cancelled) return

        container.replaceChildren()
        setStatus('error')
        setError(getErrorMessage(caughtError))
      }
    }

    void renderDiagram()

    return () => {
      cancelled = true
    }
  }, [description, diagramId, normalizedChart, theme, title])

  const copySource = async () => {
    if (!navigator.clipboard) return

    try {
      await navigator.clipboard.writeText(normalizedChart)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1_500)
    } catch {
      setCopied(false)
    }
  }

  const downloadSvg = () => {
    const svgElement = containerRef.current?.querySelector('svg')

    if (!svgElement) return

    const serializer = new XMLSerializer()
    const serializedSvg = serializer.serializeToString(svgElement)
    const blob = new Blob([serializedSvg], {
      type: 'image/svg+xml;charset=utf-8',
    })

    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = `${toFilename(title)}.svg`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(objectUrl)
  }

  return (
    <figure
      {...props}
      className={cn(
        'my-8 overflow-hidden rounded-2xl border',
        'border-[var(--ae-border)]',
        'bg-[color-mix(in_srgb,var(--ae-surface)_82%,transparent)]',
        'shadow-[0_18px_55px_rgba(0,0,0,0.14)]',
        'backdrop-blur-xl',
        className,
      )}
      data-slot='docs-mermaid'
      data-status={status}
    >
      {showToolbar && (
        <header
          className={cn(
            'flex min-h-12 flex-wrap items-center gap-3',
            'border-b border-[var(--ae-border)] px-4 py-2',
            'bg-[color-mix(in_srgb,var(--ae-background)_72%,transparent)]',
          )}
        >
          <div className='min-w-0'>
            <div className='truncate text-sm font-semibold text-[var(--ae-foreground)]'>
              {title}
            </div>

            <div className='text-xs text-[var(--ae-foreground-muted)]'>
              Mermaid diagram
            </div>
          </div>

          <div className='ml-auto flex items-center gap-2'>
            <button
              type='button'
              className={toolbarButtonClass}
              onClick={() => void copySource()}
            >
              <CopyIcon />

              <span>{copied ? 'Copied' : 'Copy source'}</span>
            </button>

            <button
              type='button'
              className={toolbarButtonClass}
              disabled={status !== 'ready'}
              onClick={downloadSvg}
            >
              <DownloadIcon />

              <span>Download SVG</span>
            </button>
          </div>
        </header>
      )}

      <div aria-busy={status === 'loading'} className='relative min-h-40'>
        {status === 'loading' && (
          <div
            className={cn(
              'absolute inset-0 z-10 grid min-h-40 place-items-center',
              'bg-[color-mix(in_srgb,var(--ae-surface)_82%,transparent)]',
            )}
          >
            <div className='flex items-center gap-3 text-sm text-[var(--ae-foreground-muted)]'>
              <LoadingSpinner />

              <span>Rendering diagram…</span>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={cn(
            'overflow-x-auto p-5 sm:p-7',
            '[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full',
          )}
          data-slot='docs-mermaid-content'
        />

        {status === 'error' && (
          <div className='p-5 sm:p-7'>
            <div
              className={cn(
                'rounded-xl border px-4 py-3',
                'border-[rgb(var(--ae-danger-rgb)_/_0.35)]',
                'bg-[rgb(var(--ae-danger-rgb)_/_0.1)]',
              )}
              role='alert'
            >
              <div className='font-semibold text-[var(--ae-danger)]'>
                Unable to render Mermaid diagram
              </div>

              <p className='mt-1 text-sm leading-6 text-[var(--ae-foreground-muted)]'>
                {error ?? 'The diagram contains invalid Mermaid syntax.'}
              </p>
            </div>

            {showSourceOnError && (
              <details className='group mt-4 overflow-hidden rounded-xl border border-[var(--ae-border)]'>
                <summary
                  className={cn(
                    'cursor-pointer list-none px-4 py-3',
                    'text-sm font-medium text-[var(--ae-foreground)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px]',
                    'focus-visible:outline-[var(--ae-accent)]',
                  )}
                >
                  <span className='flex items-center justify-between gap-3'>
                    <span>Mermaid source</span>

                    <span
                      aria-hidden='true'
                      className='transition-transform group-open:rotate-180'
                    >
                      ↓
                    </span>
                  </span>
                </summary>

                <pre
                  className={cn(
                    'm-0 overflow-x-auto border-t',
                    'border-[var(--ae-border)] bg-[#090b12]',
                    'p-4 text-sm leading-6 text-white',
                  )}
                >
                  <code>{normalizedChart}</code>
                </pre>
              </details>
            )}
          </div>
        )}

        <span className='sr-only' aria-live='polite'>
          {getStatusMessage(status)}
        </span>
      </div>

      {caption && (
        <figcaption
          className={cn(
            'border-t border-[var(--ae-border)] px-5 py-3',
            'text-center text-sm leading-6',
            'text-[var(--ae-foreground-muted)]',
          )}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

function getResolvedTheme(): MermaidTheme {
  if (typeof document === 'undefined') return 'dark'

  const htmlTheme = document.documentElement.dataset.theme
  const bodyTheme = document.body?.dataset.theme
  const configuredTheme = htmlTheme ?? bodyTheme

  if (configuredTheme === 'light') return 'light'
  if (configuredTheme === 'dark') return 'dark'

  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }

  return 'light'
}

function getThemeVariables(theme: MermaidTheme) {
  const fallback =
    theme === 'dark'
      ? {
          accent: '#22d3ee',
          background: '#090b12',
          border: '#334155',
          foreground: '#f8fafc',
          muted: '#94a3b8',
          secondary: '#a855f7',
          surface: '#111827',
        }
      : {
          accent: '#0891b2',
          background: '#ffffff',
          border: '#cbd5e1',
          foreground: '#0f172a',
          muted: '#475569',
          secondary: '#7c3aed',
          surface: '#f8fafc',
        }

  const styles = getAerealithStyles()

  const background = readCssVariable(
    styles,
    '--ae-background',
    fallback.background,
  )
  const surface = readCssVariable(styles, '--ae-surface', fallback.surface)
  const border = readCssVariable(styles, '--ae-border', fallback.border)
  const foreground = readCssVariable(
    styles,
    '--ae-foreground',
    fallback.foreground,
  )
  const muted = readCssVariable(styles, '--ae-foreground-muted', fallback.muted)
  const accent = readCssVariable(styles, '--ae-accent', fallback.accent)
  const secondary = readCssVariable(
    styles,
    '--ae-secondary',
    fallback.secondary,
  )
  const fontFamily = readCssVariable(
    styles,
    '--ae-font-body',
    'Inter, system-ui, sans-serif',
  )

  return {
    background,
    fontFamily,

    primaryColor: surface,
    primaryTextColor: foreground,
    primaryBorderColor: accent,

    secondaryColor: surface,
    secondaryTextColor: foreground,
    secondaryBorderColor: secondary,

    tertiaryColor: background,
    tertiaryTextColor: foreground,
    tertiaryBorderColor: border,

    lineColor: accent,
    textColor: foreground,

    mainBkg: surface,
    nodeBorder: border,

    clusterBkg: background,
    clusterBorder: border,

    edgeLabelBackground: background,
    labelBackground: surface,
    labelTextColor: foreground,

    actorBkg: surface,
    actorBorder: accent,
    actorTextColor: foreground,

    signalColor: accent,
    signalTextColor: foreground,

    noteBkgColor: surface,
    noteBorderColor: secondary,
    noteTextColor: foreground,

    activationBkgColor: surface,
    activationBorderColor: accent,

    loopTextColor: muted,
  }
}

function getAerealithStyles(): CSSStyleDeclaration {
  const themeElement =
    document.querySelector<HTMLElement>('[data-theme]') ??
    document.documentElement

  return window.getComputedStyle(themeElement)
}

function readCssVariable(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: string,
): string {
  return styles.getPropertyValue(name).trim() || fallback
}

function parseMermaidSvg(svg: string): SVGSVGElement {
  const parsedDocument = new DOMParser().parseFromString(svg, 'image/svg+xml')

  const parseError = parsedDocument.querySelector('parsererror')

  if (parseError) {
    throw new Error('Mermaid returned invalid SVG output.')
  }

  const svgElement = parsedDocument.documentElement

  if (
    svgElement.namespaceURI !== 'http://www.w3.org/2000/svg' ||
    svgElement.tagName.toLowerCase() !== 'svg'
  ) {
    throw new Error('Mermaid did not return an SVG diagram.')
  }

  return svgElement as unknown as SVGSVGElement
}

function applySvgAccessibility(
  svg: SVGSVGElement,
  {
    description,
    title,
  }: {
    description?: string
    title: string
  },
): void {
  svg.setAttribute('role', 'img')
  svg.setAttribute('focusable', 'false')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  if (!svg.hasAttribute('aria-labelledby') && !svg.hasAttribute('aria-label')) {
    const accessibleLabel = description ? `${title}. ${description}` : title

    svg.setAttribute('aria-label', accessibleLabel)
  }

  const existingStyle = svg.getAttribute('style')?.trim()

  svg.setAttribute(
    'style',
    [
      existingStyle,
      'max-width: 100%',
      'height: auto',
      'display: block',
      'margin-inline: auto',
    ]
      .filter(Boolean)
      .join('; '),
  )
}

function sanitizeId(value: string): string {
  const sanitized = value.replaceAll(/[^a-zA-Z0-9_-]/g, '')

  return sanitized || 'diagram'
}

function toFilename(value: string): string {
  const filename = value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')

  return filename || 'aerealith-diagram'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'The diagram contains invalid or unsupported Mermaid syntax.'
}

function getStatusMessage(status: RenderStatus): string {
  switch (status) {
    case 'loading':
      return 'Rendering Mermaid diagram.'

    case 'ready':
      return 'Mermaid diagram rendered.'

    case 'error':
      return 'Mermaid diagram could not be rendered.'

    default:
      return ''
  }
}

const toolbarButtonClass = cn(
  'inline-flex min-h-9 items-center justify-center gap-2',
  'rounded-lg border border-[var(--ae-border)] px-3',
  'text-xs font-medium text-[var(--ae-foreground-muted)]',
  'transition duration-200',
  'hover:border-[color-mix(in_srgb,var(--ae-accent)_40%,var(--ae-border))]',
  'hover:bg-[var(--ae-surface)]',
  'hover:text-[var(--ae-foreground)]',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-[var(--ae-accent)]',
  'disabled:pointer-events-none disabled:opacity-45',
)

function CopyIcon() {
  return (
    <svg aria-hidden='true' className='size-4' fill='none' viewBox='0 0 24 24'>
      <rect
        width='12'
        height='12'
        x='8'
        y='8'
        rx='2'
        stroke='currentColor'
        strokeWidth='1.75'
      />

      <path
        d='M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.75'
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg aria-hidden='true' className='size-4' fill='none' viewBox='0 0 24 24'>
      <path
        d='M12 4v11m0 0 4-4m-4 4-4-4M5 19h14'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.75'
      />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg
      aria-hidden='true'
      className='size-5 animate-spin text-[var(--ae-accent)] motion-reduce:animate-none'
      fill='none'
      viewBox='0 0 24 24'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='9'
        stroke='currentColor'
        strokeWidth='3'
      />

      <path
        className='opacity-90'
        d='M21 12a9 9 0 0 0-9-9'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='3'
      />
    </svg>
  )
}

export default Mermaid
