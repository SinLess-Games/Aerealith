# Shared Libraries

Status: Active
Owner: Platform Engineering
Last Updated: 2026-07-15
Document Type: Project Index

## Purpose

`libs/` contains reusable behavior with intentional public boundaries.

Every library must have one clear responsibility, an owner, Nx tags, a public
entry point, tests, and a local README.

## Implemented Libraries

- `content`
- `core`
- `db`
- `ui`
- `utils`

## Accepted Planned Libraries

- `api`
- `contracts`
- `flags`
- `observability`

Planned libraries are created when their release needs them. Empty folders are
not implementation.

## Dependency Rules

- Use public entry points.
- Circular dependencies are prohibited.
- Contracts do not depend on implementations.
- UI does not import server or persistence code.
- Core remains runtime-neutral.
- Database implementation remains in the data boundary.
- Utilities do not become a miscellaneous dumping ground.

See `docs/decisions/DEC-005-shared-library-set.md`.
