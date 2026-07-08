# content

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build content` to build the library.

## Running unit tests

Run `nx test content` to execute the unit tests via [Vitest](https://vitest.dev/).

## Translation workflow

English TypeScript in `src/en` is the source of truth. JSON under
`translations` is a stable interchange format for external translation tools;
the normal build never calls a translation provider. TypeScript under
`src/generated/locales` is generated and must not be edited manually.

1. Edit English content in `libs/content/src/en`.
2. Run `pnpm nx run content:export-json`.
3. Send `libs/content/translations/en/*.json` to a translation service.
4. Place returned files in `libs/content/translations/<locale>`.
5. Run `pnpm nx run content:import-json --locale=es`, or run
   `pnpm nx run content:sync` for every locale.
6. Build with `pnpm nx build content`.

Translation validation requires the same keys and array shape as English and
preserves interpolation placeholders, rich-text tags, URLs, routes, IDs, and
asset paths.

### Supported locales

The canonical `translations/en` interchange files compile as `en-US`. The
supported rollout locales are registered in `src/i18n/locale-types.ts`:

- Launch: `en-US`, `es-ES`
- Early global: `pt-BR`, `fr-FR`, `de-DE`, `ja-JP`
- Strong expansion: `it-IT`, `nl-NL`, `pl-PL`, `tr-TR`, `ko-KR`, `zh-CN`, `zh-TW`
- Community/global: `id-ID`, `vi-VN`, `ru-RU`, `uk-UA`
- EU/Nordic: `sv-SE`, `da-DK`, `fi-FI`, `nb-NO`, `cs-CZ`, `hu-HU`, `ro-RO`
- RTL later: `ar`, `he-IL`

Configured locales fall back to `en-US` until validated translated JSON is
placed in their locale directory and generated. Arabic and Hebrew are marked
with right-to-left direction metadata.

## Machine translation

Machine translation is opt-in and is never called by build, lint, test, or
typecheck. The default provider is a self-hosted LibreTranslate instance; a
local server requires no API key:

```sh
docker run -it -p 5000:5000 libretranslate/libretranslate
pnpm nx run content:translate --locale=es-ES
pnpm nx run content:validate-translations
pnpm nx run content:generate-locales
pnpm nx build content
```

Use `pnpm nx run content:translate --all` to request every configured locale.
Set `LIBRETRANSLATE_URL` to override `http://localhost:5000`. An optional
`LIBRETRANSLATE_API_KEY` is passed when present but is not required.

The command checks `/languages` first. Unsupported languages fail by default;
`--allow-fallback` explicitly writes English JSON with fallback metadata.
Machine-translated copy should be reviewed before production use. Translation
results are cached under `.translation-cache`, and `--force` bypasses cache.
