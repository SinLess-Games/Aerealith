# UI Library

Status: Active
Owner: Frontend Platform
Last Updated: 2026-07-15
Project Type: Nx library
Runtime: React and browser-compatible TypeScript
Nx Project: `ui`
Public Entry Point: `libs/ui/src/index.ts`

## Purpose

`libs/ui` owns reusable Aerealith interface primitives and design-system
components.

It may wrap accessible primitives such as Base UI while preserving Aerealith
tokens, behavior, variants, accessibility, and interaction standards.

## Boundaries

UI components may depend on runtime-neutral core types and approved frontend
utilities. They must not import:

- Database implementations.
- Server handlers.
- Provider SDKs.
- Secrets.
- Authoritative permission logic.
- Discord runtime code.

## Component Requirements

- Accessible names, focus, and keyboard behavior.
- Predictable controlled and uncontrolled behavior.
- Typed variants.
- Theme and responsive compatibility.
- No hidden authorization assumptions.
- Tests for meaningful interactions.
- Story or usage documentation for complex components.

## Commands

```bash
pnpm nx lint ui
pnpm nx typecheck ui
pnpm nx test ui
pnpm nx build ui
```

Use `pnpm nx show project ui` to inspect inferred targets.
