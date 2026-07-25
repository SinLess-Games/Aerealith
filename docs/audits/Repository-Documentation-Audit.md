# Repository Documentation Audit

**Status:** Active  
**Owner:** SinLess Games LLC  
**Product:** Aerealith  
**Last Reviewed:** 2026-07-23  
**Implementation Status:** Partial

## Scope and Method

This audit compared the 90 Markdown files present before this review with the
Nx project graph, resolved project targets, package manifests, TypeScript
paths, frontend routes and Worker entry point, Drizzle schemas and
repositories, environment access, Cloudflare configuration, GitHub workflows,
tests, and accepted decisions. Generated output, dependencies, coverage, and
real secret values were excluded.

The documentation set was approximately 134,000 lines before this work. Length
is not evidence of correctness; current claims were checked against executable
source and resolved Nx configuration.

## Findings

| Severity | Finding                                                                                    | Evidence                                                                                                                                                    | Disposition                                                                                |
| -------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| High     | Active product documents still use the prohibited `MVP / Post-MVP` classification.         | DEC-015 and matches in `docs/product/`                                                                                                                      | Unresolved. Each capability needs a product decision; bulk replacement would invent scope. |
| High     | Database variable guidance conflicts with implementation.                                  | `libs/db/src/client/database.config.ts` and `libs/db/drizzle.config.ts` use `DATABASE_URL`; engineering docs frequently prescribe `AEREALITH_DATABASE_URL`. | Current inventory corrected; target naming remains explicitly planned.                     |
| High     | Required module documentation was absent.                                                  | `docs/modules/` did not exist; DEC-002 accepts thirteen Discord modules plus a registry foundation.                                                         | Resolved by the module catalog added in this review.                                       |
| High     | Node pins conflict.                                                                        | `package.json` requires `26.5.0`; `.node-version` contains `25.9.0`; the inspection runtime emitted an engine warning.                                      | Unresolved repository configuration decision.                                              |
| High     | Product auth routes imply calls to `/api/v1/auth/*`, but no API runtime implements them.   | `apps/frontend/src/features/auth/auth-api.ts`, route constants, and absence of a service project.                                                           | Current state clarified as a frontend prototype.                                           |
| Medium   | Drizzle tables and repositories exist without committed migrations.                        | `libs/db/src/schema/**`, `libs/db/src/repositories/**`; no migration directory found.                                                                       | Current data maturity clarified.                                                           |
| Medium   | Cloudflare bindings are configured beyond the Worker interface actually consumed.          | `apps/frontend/wrangler.toml` configures queue, KV, R2, Flagship, and Analytics Engine; `apps/frontend/src/worker.ts` consumes only `ASSETS`.               | Classified as configured but unused by the current Worker.                                 |
| Medium   | Operations contains an index and backlog, not executable runbooks.                         | `docs/operations/README.md` only.                                                                                                                           | Remains partial; release readiness must not claim exercised recovery.                      |
| Medium   | `docs/MASTER_INDEX.md` was a compact compatibility index, not a complete map.              | File contents and required-document list.                                                                                                                   | Expanded navigation in this review.                                                        |
| Medium   | The manual project inventory omitted the workspace-root Nx project and exact dependencies. | Resolved Nx graph contains nine nodes including `@aerealith-ai/source`.                                                                                     | Corrected in this review.                                                                  |

## Verified Current Model

- Nine Nx graph nodes exist: one frontend application, one Playwright
  application, five shared libraries, one generator library, and the workspace
  root project.
- The frontend is a React/Vite single-page application deployed through a
  Cloudflare Worker. The Worker implements only an asset pass-through and
  `GET /__aerealith/health`.
- Authentication screens and API-client functions exist, but no authentication
  service or protected route enforcement exists.
- The data library contains PostgreSQL/Drizzle schemas, mappings, queries,
  repositories, transactions, and tests for users and waitlist data. It does
  not establish a deployed database or migration history.
- Discord, AI runtime, notifications, workflows, audit runtime, and independent
  API services are planned rather than implemented.

## Required Decisions

1. Choose and align the supported Node version.
2. Decide whether `DATABASE_URL` remains canonical or is migrated to an
   `AEREALITH_`-prefixed name in source.
3. Replace every prohibited combined scope label with one DEC-015
   classification.
4. Establish guild ownership, Discord data retention, transcript storage, and
   retry policies before Discord implementation.
5. Decide whether configured but unused Cloudflare bindings belong in the
   current frontend deployment.

## Validation Boundary

This audit records repository evidence as of 2026-07-23. It does not establish
production deployment state, external provider configuration, legal
compliance, security certification, backup recoverability, or operational
exercise results.
