# Aerealith Description Audit

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-18
Document Type: Repository and Public-Surface Audit
Audit Scope: AAPE-155
Canonical Baseline: Company and Project Structure, Project Overview, Current State

## Purpose

This audit records where Aerealith, Aerealith AI, SinLess Games LLC, SinLess
Industries, implementation status, support details, and public descriptions were
inconsistent. Every finding is either resolved, explicitly accepted with a
reason, or identified as an external action that cannot be completed by a
repository commit.

## Canonical Description

- **SinLess Industries** is the operating parent and organizational umbrella.
- **SinLess Games LLC** is the legal company currently named for contracts,
  policies, funding, copyright, and publication.
- **Aerealith** is the product and platform.
- **Aerealith AI** is the assistant and intelligence layer within Aerealith.
- Current capability claims require repository evidence; vision, roadmap,
  pricing, and funding language describe direction unless stated otherwise.
- The Aerealith support address is `support@aerealith.com`.
- The repository-supported canonical public domain is
  [aerealith.com](https://aerealith.com).

The legal and organizational limits are defined in
[Company and Project Structure](../Company-and-Project-Structure.md).

## Method

The audit searched:

- Root and section README files.
- Active vision, product, architecture, engineering, decision, and release
  documentation.
- GitHub labels, milestones, Renovate copy, project metadata, and workflows.
- Frontend metadata, sitemap, robots rules, web manifest, captions, public
  layout copy, pricing, About, home, footer, and policy content.
- Generated English content JSON.
- Repository filenames for PDF, presentation, word-processing, and pitch-deck
  artifacts.
- The public GitHub repository, public GitHub organization profile, and deployed
  Aerealith website on 2026-07-18.

No PDF, PowerPoint, Word, or other pitch-deck file was present. The investor
video caption is the only funding-media text stored in this repository.

## Findings and Disposition

| Location                                                                   | Existing wording                                                                                                                                      | Issue                                                                                                    | Required action                                                                                                                                                                  | Status                                           |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Company and Project Structure](../Company-and-Project-Structure.md)       | File was empty.                                                                                                                                       | No canonical organizational or naming relationship existed.                                              | Define the Industries to Games LLC to Aerealith to Aerealith AI hierarchy, legal caveats, naming table, contributor language, and future-project boundaries.                     | Resolved                                         |
| [Project Overview](../Project-Overview.md)                                 | Major product claims had no Markdown links.                                                                                                           | Readers could not distinguish supported claims from narrative.                                           | Add inline evidence for vision, trust, Discord, self-hosting, provider boundaries, stack, current state, and planned work.                                                       | Resolved                                         |
| [Current State](../CURRENT_STATE.md)                                       | Referenced file did not exist.                                                                                                                        | Vision documents pointed to a missing source and current versus planned claims were unclear.             | Create a current-state summary backed by current architecture and project inventory.                                                                                             | Resolved                                         |
| [Documentation Index](../README.md) and [Master Index](../MASTER_INDEX.md) | No direct overview, company, or current-state navigation; master index was empty.                                                                     | Contributor onboarding was incomplete.                                                                   | Add verified start-here paths and reciprocal section navigation.                                                                                                                 | Resolved                                         |
| Vision current-state links                                                 | Used `./CURRENT_STATE.md` from `docs/vision`.                                                                                                         | Three links resolved to a nonexistent file.                                                              | Point them to `../CURRENT_STATE.md`.                                                                                                                                             | Resolved                                         |
| [Architecture Index](../architecture/README.md)                            | Linked nonexistent `System Architecture.md`.                                                                                                          | Architecture reading order was broken.                                                                   | Link the active Current Architecture source.                                                                                                                                     | Resolved                                         |
| [Root README](../../README.md)                                             | Repository titled Aerealith AI; stale Node and pnpm pins; planned projects shown as implemented; broken configuration links; informal company credit. | Public onboarding conflicted with repository and naming truth.                                           | Use Aerealith, current pins and project inventory, verified links, and the Industries operating attribution.                                                                     | Resolved                                         |
| [Documentation Standards](../engineering/Documentation%20Standards.md)     | Required Aerealith AI on first product reference.                                                                                                     | Directly contradicted the canonical platform and assistant distinction.                                  | Replace with context-specific product, assistant, legal-company, and operating-umbrella rules.                                                                                   | Resolved                                         |
| Active product documents                                                   | Used Aerealith AI as the platform and presented target specifications without file-level implementation status.                                       | Direct links could contradict the canonical definition or imply planned capabilities were available.     | Reserve Aerealith for the platform, retain Aerealith AI for the assistant, and add target-state metadata plus canonical and current-state links to all active product documents. | Resolved                                         |
| Draft architecture and engineering documents                               | Used Aerealith AI for the whole platform and described target architecture in language that could be read as current.                                 | Architecture deep links could override repository evidence and the canonical identity model.             | Normalize platform naming, add implementation-state metadata and current-architecture links, and mark Discord and other target integrations as planned.                          | Resolved                                         |
| [Technology Stack](../STACK.md)                                            | Treated dependency presence as proof that tRPC, Resend, Grafana Faro, Pino, and Fumadocs integrations were implemented.                               | Installed packages were mixed with active runtime capabilities.                                          | Add an Installed status and reserve Implemented for repository code, configuration, or deployment evidence that actively uses the technology.                                    | Resolved                                         |
| [Secrets Standard](../engineering/Secrets.md)                              | The tracked file ended mid-link and contained no complete secret-management standard.                                                                 | An active engineering-security document was unusable and could not support current-versus-target review. | Reconstruct the standard with repository-backed current controls, explicitly planned integrations, ownership, lifecycle, incident-response, and testing rules.                   | Resolved                                         |
| Active architecture and engineering metadata                               | Twenty-eight files used `Tim Pierce / SinLess Games` as owner.                                                                                        | Informal owner metadata conflicted with the documented legal entity.                                     | Standardize document owner metadata to SinLess Games LLC.                                                                                                                        | Resolved                                         |
| [About content](../../libs/content/src/en/about/index.ts)                  | Live copy said Helix AI and used Aerealith AI for the whole platform.                                                                                 | Legacy brand and product-role conflict.                                                                  | Remove Helix, use Aerealith for the platform, identify Aerealith AI as the assistant, and add Industries attribution.                                                            | Resolved                                         |
| Active home, footer, header, and investor-caption content                  | Used Aerealith AI as the whole product and promoted unavailable sign-up.                                                                              | Public copy overstated availability and blurred the product distinction.                                 | Use Aerealith, route marketing CTAs to the waitlist, retain Aerealith AI only for assistant context, and add the operating attribution.                                          | Resolved                                         |
| Policy source and generated English JSON                                   | Used `support@sinlessgames.com` 68 times in each layer.                                                                                               | General Aerealith support address was obsolete.                                                          | Replace with the confirmed `support@aerealith.com` and regenerate English JSON through Nx.                                                                                       | Resolved                                         |
| Nine policy introduction statements                                        | Said Aerealith AI was operated solely by SinLess Games LLC.                                                                                           | Omitted the confirmed Industries operating umbrella.                                                     | State that Aerealith is operated under SinLess Industries and provided by SinLess Games LLC; retain the LLC as legal party.                                                      | Resolved; legal review still required            |
| Draft legal policies generally                                             | Use Aerealith AI as the defined service name and SinLess Games LLC as legal provider.                                                                 | A broad rename could change intended legal scope.                                                        | Retain until counsel approves the platform-wide legal terminology; nonlegal copy follows the canonical naming standard now.                                                      | Explicitly accepted pending legal review         |
| Pricing route and home pricing preview                                     | Exact prices, limits, free-forever language, and self-hosting appeared product-ready.                                                                 | Planned capabilities could be mistaken for an offer.                                                     | Label all plans, prices, limits, features, and deployment options illustrative and unavailable for purchase.                                                                     | Resolved                                         |
| Public sign-up CTAs                                                        | Linked an account route whose backend is not implemented.                                                                                             | Marketing implied registration was available.                                                            | Route public header, home, and About CTAs to the waitlist. Keep auth routes as development prototypes, not public availability claims.                                           | Resolved                                         |
| Frontend metadata, sitemap, and robots                                     | Used `aerealith.ai`; sitemap listed nonexistent routes.                                                                                               | Conflicted with repository deployment evidence and sent crawlers to 404 pages.                           | Standardize active metadata on `aerealith.com` and list only implemented public routes.                                                                                          | Resolved                                         |
| Internationalization tests                                                 | Contain `aerealith.ai` as inert example URLs.                                                                                                         | They are test fixtures, not public canonical-domain claims.                                              | Retain until a separate fixture cleanup; they do not ship as metadata or navigation.                                                                                             | Explicitly accepted                              |
| [Development Plan](../../DEVELOPMENT_PLAN.md)                              | Called the whole product Aerealith AI and presented an outdated snapshot as current.                                                                  | Could override current repository evidence.                                                              | Mark it superseded, correct the distinction, and point readers to current-state and release sources.                                                                             | Resolved                                         |
| Active labels, milestones, and Renovate copy                               | Used Aerealith AI as the project name.                                                                                                                | Repository automation conflicted with canonical platform naming.                                         | Use Aerealith for project-wide copy; retain Aerealith AI for the bot and AI-triage assistant.                                                                                    | Resolved                                         |
| Technical identifiers and assets                                           | Use `@aerealith-ai/*`, Aerealith AI IDs, filenames, and provider asset identifiers.                                                                   | Renaming may break imports, packages, URLs, or external media.                                           | Retain as compatibility identifiers until a separately planned migration exists.                                                                                                 | Explicitly accepted                              |
| Unexported legacy home modules                                             | `different.ts` and `crowdfunding.ts` contain older duplicate wording.                                                                                 | Files are not exported by the active home index but remain in compilation scope.                         | Retain temporarily for compatibility review; do not treat them as public content authority. Remove or consolidate in a focused cleanup.                                          | Explicitly accepted                              |
| [GitHub repository About](https://github.com/SinLess-Games/Aerealith)      | Homepage URL only; no repository description.                                                                                                         | Canonical repository description is not applied.                                                         | Set the About description from Positioning and retain `https://aerealith.com` as homepage.                                                                                       | External GitHub action required                  |
| [GitHub organization profile](https://github.com/SinLess-Games)            | Lists Helix AI and documents only SinLess Games LLC.                                                                                                  | Public organization profile is stale and omits SinLess Industries.                                       | Replace Helix with Aerealith and document the Industries to Games LLC operating relationship.                                                                                    | External organization-repository action required |
| [Deployed website](https://aerealith.com)                                  | Served a generic Frontend title and minimal bundle at audit time.                                                                                     | Deployment did not reflect the corrected source.                                                         | Deploy the validated frontend after checks pass.                                                                                                                                 | Deployment required                              |
| Investor video                                                             | External spoken branding may still say Aerealith AI for the whole platform.                                                                           | Repository can correct captions but cannot alter hosted spoken content safely.                           | Review the hosted video and replace or re-edit it if its spoken description conflicts with the canonical model.                                                                  | External media review required                   |

## Accepted Exceptions

An accepted exception is not permission to repeat stale public wording.

The following are intentionally retained:

- SinLess Games LLC in legal, contracting, payment, copyright, publisher,
  policy-owner, and intellectual-property contexts.
- Aerealith AI for the assistant, intentional Discord bot identity, and
  AI-powered project-triage automation.
- Technical package scopes, IDs, asset paths, and provider identifiers where a
  rename could break compatibility.
- Historical naming in archived or explicitly superseded material.
- Future self-hosting language only when it is clearly labeled planned.

## External Follow-Up

Repository files cannot complete these actions:

1. Set the GitHub repository About description.
2. Update the SinLess Games organization profile repository.
3. Review or replace externally hosted investor-video speech.
4. Deploy the validated frontend source.

These items remain visible in the table so they cannot be mistaken for completed
repository work.

## Maintenance Rule

Run this audit again when company structure, legal responsibility, canonical
domain, product naming, public availability, or deployment status changes. New
public copy must link to [Current State](../CURRENT_STATE.md) when it makes a
capability claim that could be mistaken for current implementation.
