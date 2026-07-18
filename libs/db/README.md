# Database Library

Status: Active
Owner: Data Platform
Last Updated: 2026-07-15
Project Type: Nx library
Runtime: Node.js and compatible service runtimes
Nx Project: `db`
Public Entry Point: `libs/db/src/index.ts`
Primary Database: PostgreSQL
ORM: Drizzle ORM
Compatibility Target: CockroachDB

## Purpose

`libs/db` owns relational persistence behavior:

- Drizzle table and relation definitions.
- Migration generation and execution.
- Database connections.
- Repository implementations.
- Persistence-to-domain mapping.
- Transaction and retry behavior.
- PostgreSQL and CockroachDB compatibility tests.

## Boundaries

- Domain entities do not import Drizzle.
- Contracts do not expose database rows.
- Repositories return domain entities or `Result`.
- Mapping between persistence and domain lives in the data layer.
- Database secrets enter through typed runtime configuration.
- Provider-specific database behavior is documented and tested.

## Commands

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm nx build db
pnpm nx lint db
pnpm nx typecheck db
pnpm nx test db
```

## Migration Requirements

- Migrations are ordered and committed.
- A fresh database reaches the current schema through one documented command.
- CI applies migrations to an empty PostgreSQL database.
- Destructive changes include rollback and data-migration analysis.
- CockroachDB compatibility is tested and never assumed.

## Related Decisions

- `docs/decisions/DEC-004-relational-database-and-orm.md`
- `docs/decisions/DEC-006-domain-persistence-mapping.md`
- `docs/decisions/DEC-009-persistence-entity-form.md`
