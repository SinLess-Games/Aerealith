import {
  AerealithError,
  CommonErrorCode,
  HttpErrorCode,
  HttpStatus,
  getHttpErrorByStatus,
  isErrorCode,
} from '@aerealith-ai/core'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router'

type ErrorRouteProps = { error?: unknown; reset?: () => void }
type BoundaryProps = { children: ReactNode }
type BoundaryState = { error?: unknown }
type ErrorView = {
  statusCode: number
  code: string
  title: string
  description: string
}

const fallback: ErrorView = {
  statusCode: HttpStatus.InternalServerError,
  code: CommonErrorCode.INTERNAL_ERROR,
  title: HttpErrorCode.INTERNAL_SERVER_ERROR.reason,
  description: HttpErrorCode.INTERNAL_SERVER_ERROR.meaning,
}

function hasStatus(error: unknown): error is {
  status: number
  statusText?: string
  data?: unknown
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  )
}

function getMessage(data: unknown) {
  if (typeof data === 'string') return data
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message
  }
  return undefined
}

export function resolveError(error: unknown): ErrorView {
  if (error instanceof AerealithError) {
    const http = getHttpErrorByStatus(
      error.statusCode as Parameters<typeof getHttpErrorByStatus>[0],
    )
    return {
      statusCode: error.statusCode,
      code: error.code,
      title: http?.reason ?? fallback.title,
      description:
        error.isClientError && error.message
          ? error.message
          : (http?.meaning ?? fallback.description),
    }
  }

  if (hasStatus(error)) {
    const http = getHttpErrorByStatus(
      error.status as Parameters<typeof getHttpErrorByStatus>[0],
    )
    const candidate =
      typeof error.data === 'object' &&
      error.data !== null &&
      'code' in error.data
        ? error.data.code
        : undefined
    return {
      statusCode: error.status,
      code: isErrorCode(candidate)
        ? candidate
        : error.status === HttpStatus.NotFound
          ? CommonErrorCode.NOT_FOUND
          : CommonErrorCode.UNKNOWN_ERROR,
      title: error.statusText || http?.reason || fallback.title,
      description:
        getMessage(error.data) ?? http?.meaning ?? fallback.description,
    }
  }

  return fallback
}

export function ErrorRoute({ error, reset }: ErrorRouteProps) {
  const view = resolveError(error)
  return (
    <main className='flex min-h-screen items-center justify-center bg-[var(--ae-background)] px-6 py-16 text-[var(--ae-foreground)]'>
      <section
        className='w-full max-w-2xl border-l-4 border-[var(--ae-accent)] pl-6 sm:pl-10'
        aria-labelledby='error-title'
      >
        <p className='text-sm font-semibold uppercase text-[var(--ae-accent)]'>
          Error {view.statusCode}
        </p>
        <h1
          id='error-title'
          className='mt-3 text-3xl font-semibold sm:text-4xl'
        >
          {view.title}
        </h1>
        <p className='mt-4 max-w-xl leading-7 text-[var(--ae-foreground-muted)]'>
          {view.description}
        </p>
        <p className='mt-4 font-mono text-xs text-[var(--ae-foreground-muted)]'>
          {view.code}
        </p>
        <div className='mt-8 flex flex-wrap gap-3'>
          {reset ? (
            <button
              type='button'
              onClick={reset}
              className='rounded-md bg-[var(--ae-accent)] px-4 py-2 text-sm font-semibold text-[var(--ae-accent-foreground)]'
            >
              Try again
            </button>
          ) : null}
          <Link
            to='/'
            className='rounded-md border border-[var(--ae-border)] px-4 py-2 text-sm font-semibold'
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  )
}

export class GlobalErrorBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
  state: BoundaryState = {}

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unhandled frontend route error', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: undefined })
  }

  render() {
    return this.state.error === undefined ? (
      this.props.children
    ) : (
      <ErrorRoute error={this.state.error} reset={this.reset} />
    )
  }
}

export default ErrorRoute
