# Content and Localization Library

Status: Active
Owner: Content Platform
Last Updated: 2026-07-15
Project Type: Nx library
Runtime: TypeScript tooling and generated browser-safe content
Nx Project: `content`
Public Entry Point: `libs/content/src/index.ts`

## Purpose

`libs/content` owns structured Aerealith copy, English source content,
translation interchange files, locale metadata, generated locale modules, and
the self-hosted translation workflow.

English TypeScript under `src/en` is the source of truth. JSON under
`translations` is the interchange format. TypeScript under
`src/generated/locales` is generated and must not be edited manually.

## Core Commands

```bash
pnpm nx run content:export-json
pnpm nx run content:validate-translations
pnpm nx run content:generate-locales
pnpm nx run content:sync
pnpm nx build content
pnpm nx run content:typecheck
```

## Translation

Start and use the local LibreTranslate workflow:

```bash
pnpm nx run content:libretranslate-up
pnpm nx run content:translate --locale=es-ES
pnpm nx run content:validate-translations
pnpm nx run content:generate-locales
pnpm nx run content:libretranslate-down
```

Use `--all` only when every configured model is available and the resulting
content will be reviewed.

## Integrity Rules

Translation validation must preserve:

- Keys and array shape.
- Interpolation placeholders.
- Rich-text tags.
- Routes and URLs.
- IDs and asset paths.
- Locale direction metadata.

Machine-translated text requires review before production use.

## Boundaries

This library owns content and localization mechanics. It does not own product
authorization, persistence, provider credentials, or application routing logic.
