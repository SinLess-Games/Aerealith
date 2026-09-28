// apps/frontend/src/app/routes/marketing-site/policy.route.tsx

import { policiesBySlug } from '@aerealith-ai/content';
import {
  AerealithError,
  CommonErrorCode,
  HttpStatus,
} from '@aerealith-ai/core';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router';

import { RouteMetadataHead } from '../../util/route-metadata';
import { ErrorRoute } from '../[error].route';

const SITE_URL = 'https://aerealith.com';

const policyNotFoundError = new AerealithError(
  'The requested policy could not be found.',
  {
    code: CommonErrorCode.NOT_FOUND,
    statusCode: HttpStatus.NotFound,
  },
);

type Policy = (typeof policiesBySlug)[keyof typeof policiesBySlug];

function policyPath(slug: string): string {
  return `/policies/${encodeURIComponent(slug)}`;
}

function policyUrl(slug: string): string {
  return new URL(policyPath(slug), SITE_URL).toString();
}

function createPolicyDescription(policy: Policy): string {
  const firstSection = policy.sections[0];
  const firstParagraph = firstSection?.body?.[0];

  if (firstParagraph) {
    return firstParagraph;
  }

  return `Read the Aerealith ${policy.meta.title}.`;
}

function toIsoDate(value: string): string | undefined {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString().slice(0, 10);
}

/** Renders one public legal or policy document by its `:slug`. */
export function PolicyRoute() {
  const { slug } = useParams<{ slug: string }>();
  const policy = slug ? policiesBySlug[slug] : undefined;

  if (!policy || !slug) {
    return <ErrorRoute error={policyNotFoundError} />;
  }

  const path = policyPath(slug);
  const canonicalUrl = policyUrl(slug);
  const title = `${policy.meta.title} | Aerealith`;
  const description = createPolicyDescription(policy);
  const datePublished = toIsoDate(policy.meta.effectiveDate);
  const dateModified = toIsoDate(policy.meta.lastUpdated);

  return (
    <>
      <RouteMetadataHead title={title} description={description} path={path} />

      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${canonicalUrl}#webpage`,
            url: canonicalUrl,
            name: title,
            description,
            inLanguage: 'en-US',
            isPartOf: {
              '@id': 'https://aerealith.com/#website',
            },
            publisher: {
              '@id': 'https://aerealith.com/#organization',
            },
            ...(datePublished ? { datePublished } : {}),
            ...(dateModified ? { dateModified } : {}),
          })}
        </script>
      </Helmet>

      <article
        className="mx-auto w-full max-w-3xl px-6 py-16 text-[var(--ae-foreground)]"
        aria-labelledby="policy-title"
      >
        <header className="border-b border-[var(--ae-border-subtle)] pb-8">
          <p className="text-sm font-semibold tracking-wide text-[var(--ae-accent)] uppercase">
            Aerealith policy
          </p>

          <h1
            id="policy-title"
            className="mt-3 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--ae-font-heading)' }}
          >
            {policy.meta.title}
          </h1>

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ae-foreground-muted)]">
            <div className="flex gap-1">
              <dt className="font-medium text-[var(--ae-foreground)]">
                Effective:
              </dt>
              <dd>
                <time dateTime={datePublished ?? policy.meta.effectiveDate}>
                  {policy.meta.effectiveDate}
                </time>
              </dd>
            </div>

            <div className="flex gap-1">
              <dt className="font-medium text-[var(--ae-foreground)]">
                Last updated:
              </dt>
              <dd>
                <time dateTime={dateModified ?? policy.meta.lastUpdated}>
                  {policy.meta.lastUpdated}
                </time>
              </dd>
            </div>
          </dl>
        </header>

        {policy.sections.length > 1 ? (
          <nav
            className="mt-8 rounded-lg border border-[var(--ae-border-subtle)] bg-[var(--ae-surface-raised)] p-5"
            aria-label={`${policy.meta.title} table of contents`}
          >
            <h2 className="text-sm font-semibold">On this page</h2>

            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {policy.sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-[var(--ae-accent)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="mt-10 space-y-10">
          {policy.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-8"
              aria-labelledby={`${section.id}-title`}
            >
              <h2
                id={`${section.id}-title`}
                className="text-lg font-semibold sm:text-xl"
              >
                {section.title}
              </h2>

              {section.body?.map((paragraph, index) => (
                <p
                  key={`${section.id}-paragraph-${index}`}
                  className="mt-3 text-sm leading-relaxed text-[var(--ae-foreground-muted)]"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
                  {section.bullets.map((bullet, index) => (
                    <li key={`${section.id}-bullet-${index}`}>{bullet}</li>
                  ))}
                </ul>
              ) : null}

              {section.orderedItems ? (
                <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
                  {section.orderedItems.map((item, index) => (
                    <li key={`${section.id}-ordered-item-${index}`}>{item}</li>
                  ))}
                </ol>
              ) : null}

              {section.note ? (
                <aside
                  className="mt-4 rounded-md border border-[var(--ae-border-subtle)] bg-[var(--ae-surface-raised)] p-4 text-sm leading-relaxed text-[var(--ae-foreground-muted)]"
                  aria-label="Policy note"
                >
                  {section.note}
                </aside>
              ) : null}
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-[var(--ae-border-subtle)] pt-6">
          <Link
            to="/"
            className="inline-flex rounded-md text-sm font-semibold text-[var(--ae-accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ae-accent)]"
          >
            Return to Aerealith home
          </Link>
        </footer>
      </article>
    </>
  );
}

export default PolicyRoute;
