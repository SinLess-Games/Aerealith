// apps/frontend/src/app/routes/[error].route.tsx

import {
  AerealithError,
  CommonErrorCode,
  HttpErrorCode,
  HttpStatus,
  getHttpErrorByStatus,
  isErrorCode,
} from '@aerealith-ai/core';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router';

import { RouteMetadataHead } from '../util/route-metadata';

type ErrorRouteProps = {
  error?: unknown;
  reset?: () => void;
};

type BoundaryProps = {
  children: ReactNode;
};

type BoundaryState = {
  error?: unknown;
};

type ErrorView = {
  statusCode: number;
  code: string;
  title: string;
  description: string;
};

const SITE_URL = 'https://aerealith.com';

const fallback: ErrorView = {
  statusCode: HttpStatus.InternalServerError,
  code: CommonErrorCode.INTERNAL_ERROR,
  title: HttpErrorCode.INTERNAL_SERVER_ERROR.reason,
  description: HttpErrorCode.INTERNAL_SERVER_ERROR.meaning,
};

function hasStatus(error: unknown): error is {
  status: number;
  statusText?: string;
  data?: unknown;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  );
}

function getMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return undefined;
}

function getErrorTitle(view: ErrorView): string {
  return `${view.statusCode} ${view.title} | Aerealith`;
}

function getErrorDescription(view: ErrorView): string {
  return view.description || 'An unexpected error occurred in Aerealith.';
}

function getErrorCanonicalUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return new URL(normalizedPath, SITE_URL).toString();
}

export function resolveError(error: unknown): ErrorView {
  if (error instanceof AerealithError) {
    const http = getHttpErrorByStatus(
      error.statusCode as Parameters<typeof getHttpErrorByStatus>[0],
    );

    return {
      statusCode: error.statusCode,
      code: error.code,
      title: http?.reason ?? fallback.title,
      description:
        error.isClientError && error.message
          ? error.message
          : (http?.meaning ?? fallback.description),
    };
  }

  if (hasStatus(error)) {
    const http = getHttpErrorByStatus(
      error.status as Parameters<typeof getHttpErrorByStatus>[0],
    );

    const candidate =
      typeof error.data === 'object' &&
      error.data !== null &&
      'code' in error.data
        ? error.data.code
        : undefined;

    let code: string = CommonErrorCode.UNKNOWN_ERROR;

    if (isErrorCode(candidate)) {
      code = candidate;
    } else if (error.status === HttpStatus.NotFound) {
      code = CommonErrorCode.NOT_FOUND;
    }

    return {
      statusCode: error.status,
      code,
      title: error.statusText || http?.reason || fallback.title,
      description:
        getMessage(error.data) ?? http?.meaning ?? fallback.description,
    };
  }

  return fallback;
}

export function ErrorRoute({ error, reset }: Readonly<ErrorRouteProps>) {
  const { pathname } = useLocation();
  const view = resolveError(error);

  const title = getErrorTitle(view);
  const description = getErrorDescription(view);
  const canonicalUrl = getErrorCanonicalUrl(pathname);
  const isNotFound = view.statusCode === HttpStatus.NotFound;
  const isRetryable = Boolean(reset) && !isNotFound;

  return (
    <>
      <RouteMetadataHead
        title={title}
        description={description}
        path={pathname}
        robots="noindex, nofollow"
      />

      <Helmet>
        <meta name="googlebot" content="noindex, nofollow" />
        <meta name="robots" content="noindex, nofollow, noarchive" />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${canonicalUrl}#error`,
            url: canonicalUrl,
            name: title,
            description,
            isPartOf: {
              '@id': 'https://aerealith.com/#website',
            },
            inLanguage: 'en-US',
            isAccessibleForFree: true,
          })}
        </script>
      </Helmet>

      <main
        className="flex min-h-screen items-center justify-center bg-[var(--ae-background)] px-6 py-16 text-[var(--ae-foreground)]"
        aria-labelledby="error-title"
      >
        <section className="w-full max-w-2xl border-l-4 border-[var(--ae-accent)] pl-6 sm:pl-10">
          <p className="text-sm font-semibold uppercase text-[var(--ae-accent)]">
            Error {view.statusCode}
          </p>

          <h1
            id="error-title"
            className="mt-3 text-3xl font-semibold sm:text-4xl"
          >
            {view.title}
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-[var(--ae-foreground-muted)]">
            {view.description}
          </p>

          <p
            className="mt-4 font-mono text-xs text-[var(--ae-foreground-muted)]"
            aria-label={`Error code: ${view.code}`}
          >
            {view.code}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {isRetryable ? (
              <button
                type="button"
                onClick={reset}
                className="rounded-md bg-[var(--ae-accent)] px-4 py-2 text-sm font-semibold text-[var(--ae-accent-foreground)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]"
              >
                Try again
              </button>
            ) : null}

            <Link
              to="/"
              className="rounded-md border border-[var(--ae-border)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--ae-surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]"
            >
              Return home
            </Link>
          </div>

          {isNotFound ? (
            <p className="mt-8 text-sm text-[var(--ae-foreground-muted)]">
              Check the address, use the navigation, or return to the homepage.
            </p>
          ) : null}
        </section>
      </main>
    </>
  );
}

export class GlobalErrorBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
  readonly state: BoundaryState = {};

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unhandled frontend route error', error, info.componentStack);
  }

  private readonly reset = () => {
    this.setState({ error: undefined });
  };

  render() {
    return this.state.error === undefined ? (
      this.props.children
    ) : (
      <ErrorRoute error={this.state.error} reset={this.reset} />
    );
  }
}

export default ErrorRoute;
