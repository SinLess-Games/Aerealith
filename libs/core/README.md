# Core Library

Status: Active
Owner: Platform Engineering
Last Updated: 2026-07-15
Project Type: Nx library
Runtime: Runtime-neutral TypeScript
Nx Project: `core`
Public Entry Point: `libs/core/src/index.ts`

## Purpose

`libs/core` owns the smallest reusable foundations that are independent of UI,
transport, persistence, providers, and deployment runtimes.

Expected ownership includes identifiers, error primitives, the shared `Result`
type, constants, and foundational domain-neutral logic.

## Allowed Dependencies

Core may depend only on carefully reviewed runtime-neutral packages. It must not
depend on:

- `libs/db`
- `libs/api`
- `libs/ui`
- provider SDKs
- Cloudflare runtime APIs
- Node-only APIs unless isolated and justified

## Commands

```bash
pnpm nx build core
pnpm nx lint core
pnpm nx typecheck core
pnpm nx test core
```

Check `pnpm nx show project core` for configured or inferred targets.

## Public API Rule

Consumers import only from the public entry point. Internal source paths are not
a public contract.

## Verification

- Build and typecheck pass.
- Unit coverage remains at or above repository thresholds.
- Public exports are intentional.
- No runtime-specific dependency enters core.
- Error and Result primitives satisfy DEC-007 and DEC-008.
