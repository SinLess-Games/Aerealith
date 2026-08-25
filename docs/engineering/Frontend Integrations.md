# Frontend Integrations

Status: Active
Owner: Frontend Platform
Last Updated: 2026-07-30

## Overview

The frontend has opt-in loaders for Google Tag Manager, Google AdSense,
Datadog Browser RUM, Cloudflare Web Analytics, Google Search Console
verification, and Cloudflare Turnstile. Missing configuration disables each
integration safely. Browser variables beginning with `VITE_` are public and
must never contain server API keys or secrets.

The internal consent provider is a technical foundation, not a claim of legal
compliance. Connect a certified consent-management platform where applicable.
Necessary functionality is always available; analytics, advertising, and
session replay are independently controlled. Users can reopen the settings
from the public footer.

## Google Tag Manager and GA4

Set `VITE_GTM_CONTAINER_ID` to a valid `GTM-...` container. GTM loads only in a
production build after analytics consent. Configure GA4 page views and product
events in GTM; do not add a standalone GA4 script. SPA page views exclude
sensitive query parameters.

Disable GTM by leaving the variable empty. Use GTM preview mode for local
configuration work rather than sending production analytics.

## Google AdSense

Set `VITE_ADSENSE_CLIENT_ID` to the Google-issued `ca-pub-...` value. Keep
`VITE_ADSENSE_TEST_MODE=true` outside production. The reusable `AdsenseUnit`
refuses to render without advertising consent and blocks private/authenticated
routes. Place units only in approved public articles, tutorials, research, or
free documentation.

Replace `apps/frontend/public/ads.txt` with the exact publisher record Google
provides. The repository deliberately contains no invented publisher record.

## Datadog Browser RUM

Set the documented `VITE_DATADOG_*` variables. The client token and application
ID are designed for browser exposure; a Datadog API key is not. RUM is disabled
in development and tests and initializes only after analytics consent.

Inputs are masked by default, URLs lose queries and fragments before reporting,
and session replay requires separate consent. Never attach passwords, tokens,
API keys, prompts, private messages/documents, or payment details to RUM events.

## Cloudflare Turnstile

Set the public `VITE_TURNSTILE_SITE_KEY`. Registration sends the resulting
single-use token to the existing auth Worker. Configure the server-only
`TURNSTILE_SECRET` and comma-separated `TURNSTILE_HOSTNAMES` secret/variable on
that Worker. Production hostname allowlists must not contain `localhost`.

The auth Worker calls Siteverify, requires `success`, the `registration` action,
and an approved hostname, and fails closed on verification errors. Client-side
widget completion is never sufficient validation. Contact and waitlist forms
are not protected yet because their current UI has no server submission
handler; add Siteverify to a real handler before adding a widget.

## Search Console and Cloudflare Web Analytics

`VITE_GOOGLE_SITE_VERIFICATION` adds the Google verification meta element only
when configured. DNS verification through Cloudflare is preferred because it
does not depend on a frontend deployment.

Cloudflare Web Analytics requires both
`VITE_CLOUDFLARE_WEB_ANALYTICS_ENABLED=true` and a token. It loads only after
analytics consent in production and uses its SPA mode. Application events stay
in GTM to avoid duplication.

## Content Security Policy

The repository currently defines security headers but no CSP. A deployment CSP
must allow only the integrations actually enabled. Relevant origins are:

- GTM/GA4: `https://www.googletagmanager.com`,
  `https://www.google-analytics.com`
- AdSense: `https://pagead2.googlesyndication.com`,
  `https://googleads.g.doubleclick.net`
- Turnstile scripts and frames: `https://challenges.cloudflare.com`
- Cloudflare Web Analytics: `https://static.cloudflareinsights.com`
- Datadog: the intake origins for the selected `VITE_DATADOG_SITE`

Do not add `unsafe-eval`, broad wildcards, or weaken frame protections.

## Local Testing

Keep telemetry enable flags false and AdSense test mode true. Unit tests mock
third-party behavior and make no analytics, advertising, or Siteverify network
requests. Restart Vite after environment changes.
