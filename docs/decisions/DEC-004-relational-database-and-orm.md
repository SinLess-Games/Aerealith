# DEC-004 — Relational Database and ORM

Status: Accepted
Owner: SinLess Games LLC
Decision Date: 2026-07-15
Last Updated: 2026-07-15
Document Type: Decision Record
Blocks: 0.2 — Core Domain & Data Platform
Supersedes: Conflicting undocumented guidance and deleted RFC references
Superseded By: None

## Summary

PostgreSQL is the default relational database, Drizzle ORM is the data-access layer, and CockroachDB compatibility is an explicit distributed-deployment target.

## Context

The data release cannot define migrations, repositories, transactions, or
persistence entities without a database and ORM decision. The repository and
technology stack now contain PostgreSQL and Drizzle, while the long-term
platform direction requires a path to distributed SQL.

## Decision

- PostgreSQL is the default development and initial production relational
  database.
- Drizzle ORM owns typed table definitions, relational queries, migration
  generation, and migration execution.
- CockroachDB is an accepted compatibility target for deployments that require
  distributed SQL and horizontal resilience.
- CockroachDB compatibility must be tested; PostgreSQL compatibility alone is
  not evidence of CockroachDB safety.
- Raw SQL is allowed when clearer or more capable, but it must be parameterized,
  tested, and documented when non-obvious.

## Rationale

PostgreSQL provides a mature default and strong local-development path. Drizzle
keeps schemas and SQL visible while preserving TypeScript integration.
CockroachDB retains the desired resilient deployment direction without forcing
distributed-database complexity into the first release.

## Consequences

### Positive

- Contributors have one binding interpretation.
- Release planning can use objective gates.
- Architecture and engineering documents can remove conflicting language.
- Tests can verify the decision rather than relying on prose.

### Tradeoffs

- Existing documentation and code may require migration.
- The decision narrows implementation freedom.
- Any future reversal requires an explicit superseding record.

## Implementation Requirements

- Domain code does not import Drizzle or database clients.
- Migrations are ordered, committed, reviewable, and reversible where practical.
- CI proves migrations apply to an empty PostgreSQL database.
- Compatibility CI or scheduled validation covers CockroachDB-specific
  transaction retries, SQL features, indexes, identifiers, and migrations.
- Production connections use typed runtime configuration and secret injection.
- Repository methods return domain entities or `Result`, never raw rows.

## Verification

- One command migrates a fresh PostgreSQL database.
- Schema drift checks fail when generated and committed migration state differ.
- CockroachDB compatibility tests document supported and unsupported behavior.
- No ORM type is exported from contracts or public API responses.

## Implementation Status

PostgreSQL, `pg`, Drizzle ORM, and Drizzle tooling are present in the repository. CockroachDB compatibility remains planned and must not be described as implemented.

## Alternatives Considered

CockroachDB as the only initial database was rejected as unnecessary early operational complexity. Prisma and TypeORM were not selected because Drizzle is already adopted and better matches the desired SQL visibility.

## Related Documentation

- [`docs/README.md`](../README.md)
- [`docs/STACK.md`](../STACK.md)
- [`docs/architecture/`](../architecture/)
- [`docs/engineering/`](../engineering/)
- [`docs/releases/`](../releases/)

## Change Policy

This record may be corrected for clarity without changing the decision.
A material change requires a new decision that names this record in
`Supersedes`.
