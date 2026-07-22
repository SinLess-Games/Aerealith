# Aerealith License Policy

> **Draft for attorney review before publication or contributor acceptance.**

Copyright (c) 2026 SinLess Games LLC

## Purpose

Aerealith is a multi-license repository. This policy describes the intended
license for material owned by SinLess Games LLC. It does not relicense material
owned by others or resolve uncertain ownership.

## License Model

- **AGPL-3.0-only:** default for Aerealith core applications, backend and data
  code, orchestration, official web application, shared implementation
  libraries, and repository development tooling.
- **Apache-2.0:** for separately identified public SDKs, API clients, CLI tools,
  plugin-development packages, public integration schemas or protocols, and
  example applications.
- **CC-BY-4.0:** for documentation text specifically covered by the
  [documentation notice](docs/LICENSE.md).
- **All Rights Reserved:** for brand assets and separately identified
  enterprise, hosted-service infrastructure, deployment, and internal
  operational tooling.
- **Separate terms:** for third-party material, generated assets, model weights,
  datasets, and any file containing its own notice.

A nearer directory license, package license, or file notice overrides a broader
one. A separate file notice always controls that file.

## Current Path Matrix

| Path                                                                            | Classification                                           | License or status                                                                       |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/frontend/**` except excluded assets and generated files                   | Official web application                                 | AGPL-3.0-only                                                                           |
| `apps/frontend-e2e/**`                                                          | Official application tests                               | AGPL-3.0-only                                                                           |
| `libs/content/**` except generated output and separately licensed material      | Core content implementation                              | AGPL-3.0-only                                                                           |
| `libs/core/**`                                                                  | Core domain, contracts, and schemas used by the platform | AGPL-3.0-only                                                                           |
| `libs/db/**`                                                                    | Core persistence implementation and migrations           | AGPL-3.0-only                                                                           |
| `libs/ui/**`                                                                    | Official application UI implementation                   | AGPL-3.0-only                                                                           |
| `libs/utils/**`                                                                 | Shared platform and repository utilities                 | AGPL-3.0-only                                                                           |
| `tools/generators/service/**`                                                   | Private service-development generator                    | AGPL-3.0-only                                                                           |
| `tools/scripts/**`                                                              | Repository development tooling                           | AGPL-3.0-only                                                                           |
| `docs/**/*.md` except files with a nearer notice                                | Documentation text                                       | CC-BY-4.0                                                                               |
| `docs/images/brand/**`                                                          | Official branding                                        | All Rights Reserved                                                                     |
| `apps/frontend/public/images/brand/**`                                          | Official branding                                        | All Rights Reserved                                                                     |
| `.github/project/**`                                                            | Internal project operations                              | All Rights Reserved                                                                     |
| `.github/workflows/**`                                                          | CI, hosted-service deployment, and operations            | All Rights Reserved                                                                     |
| `apps/frontend/worker-configuration.d.ts`                                       | Generated third-party declarations with existing notices | Existing Apache-2.0 and copyright notices; not relicensed                               |
| `libs/content/src/generated/**`                                                 | Generated source                                         | Inherits only from its generator and inputs; do not edit or independently relicense     |
| `libs/content/translations/**`                                                  | Generated/translated content output                      | Ownership and generated-output status require review; not independently relicensed here |
| `docs/images/**` outside `docs/images/brand/**`                                 | Images, screenshots, and generated marketing assets      | Separate or uncertain rights; not covered by CC-BY-4.0 unless explicitly stated         |
| `apps/frontend/public/images/**` outside `brand/**`                             | Runtime images and backgrounds                           | Separate or uncertain rights; not automatically relicensed                              |
| `node_modules/**`, `dist/**`, `coverage/**`, `tmp/**`, `.nx/**`, `.wrangler/**` | Dependencies or generated output                         | Excluded; retain upstream or generated status                                           |
| Any file with its own copyright or license notice                               | Separate material                                        | The file-specific notice controls                                                       |

No current repository package was verified as a public SDK, API client, CLI,
plugin SDK, public protocol package, or example application. Apache-2.0 remains
available for such a package only after it is created or explicitly classified.

## Determining a File's License

Check in this order:

1. A license or copyright notice in the file.
2. The nearest directory `LICENSE`, `LICENSE.md`, or equivalent notice.
3. The owning package's manifest and nearby license.
4. The path matrix above.
5. The root `LICENSE` default.

If these sources conflict, ownership is uncertain, or the file may be
third-party, generated, model, dataset, or vendored material, treat it as **not
relicensed** until a maintainer and legal reviewer resolve it. Do not remove an
existing notice.

## Documentation

Documentation text under `docs/` is licensed under CC-BY-4.0 subject to
`docs/LICENSE.md`. Required attribution is:

> Aerealith documentation, Copyright (c) 2026 SinLess Games LLC, licensed under
> CC BY 4.0.

Embedded source code retains its applicable software license. Logos, brand
assets, screenshots containing protected branding, third-party images, and
separately licensed assets are excluded unless expressly included.

## Commercial Licensing

SinLess Games LLC may offer separately negotiated commercial licenses. See
[COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md). A commercial license does not
change the public license of copies received under an open-source license.

## Trademarks

Software and documentation licenses grant copyright permissions only. They do
not grant rights in Aerealith names, logos, mascots, product icons, badges, or
other source identifiers. See [TRADEMARKS.md](TRADEMARKS.md).

## Contributions and Third-Party Material

Contributors must follow [CONTRIBUTING.md](CONTRIBUTING.md) and the draft
[CLA](CLA.md). Preserve copyright, attribution, and license notices. New
dependencies and copied material require ownership, provenance, and license
compatibility review. Never assume that material becomes AGPL, Apache, or CC
licensed merely because it is committed here.

## Contact

Licensing, trademark, and commercial-license questions may be sent to
`legal@sinlessgames.com`, an address already listed in repository policy
content. **Confirm that this address is active and monitored before publishing
or enabling contributor acceptance.**
