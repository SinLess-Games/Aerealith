# content

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build content` to build the library.

## Running unit tests

Run `nx test content` to execute the unit tests via [Vitest](https://vitest.dev/).

## Translation workflow

English TypeScript in `src/en` is the source of truth. JSON under
`translations` is a stable interchange format for external translation tools;
the build now invokes the local LibreTranslate workflow before compilation.
TypeScript under `src/generated/locales` is generated and must not be edited
manually.

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

Machine translation uses the self-hosted LibreTranslate instance. Lint, test,
and typecheck remain network-free. The `content:build` workflow now translates
all configured locales before compilation and fails if any configured model is
unavailable. No API key is required:

```sh
pnpm nx run content:translate --locale=es-ES
pnpm nx run content:translate
pnpm nx run content:validate-translations
pnpm nx run content:generate-locales
pnpm nx build content
```

The translate target automatically starts
`libs/content/docker-compose.libretranslate.yml` and waits for its `/languages`
health check before translating. Models are retained in the
`aerealith-libretranslate-models` Docker volume, and port 5000 is bound only to
localhost. Override the host port with `LIBRETRANSLATE_PORT`. The TypeScript
translator runs as a one-off Compose service on LibreTranslate's internal
network, so translation also works from development environments that cannot
reach Docker's published localhost port.

Container controls are also available directly:

```sh
pnpm nx run content:libretranslate-up
pnpm nx run content:libretranslate-logs
pnpm nx run content:libretranslate-down
```

Use `pnpm nx run content:translate --all` to request every configured locale.
Set `LIBRETRANSLATE_URL` to override `http://localhost:5000`. An optional
`LIBRETRANSLATE_API_KEY` is passed when present but is not required.

The command checks `/languages` first. Missing languages fail immediately;
English is never written as translated locale content. Machine-translated copy
should be reviewed before production use. Translation results are cached under
`.translation-cache`, and `--force` bypasses cache.
