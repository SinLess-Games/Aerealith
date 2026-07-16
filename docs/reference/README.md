# Reference

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Reference Index

## Purpose

This directory contains exact, searchable facts about Aerealith.

Reference documentation is intentionally less narrative than architecture or
engineering documentation. It should be generated from source whenever
practical so it cannot silently drift.

## Reference Catalog

| Reference             | Source of Truth                                              | Generation Direction     |
| --------------------- | ------------------------------------------------------------ | ------------------------ |
| Project inventory     | Nx project graph and `project.json` files                    | Generate in CI.          |
| Technology inventory  | `package.json`, lockfile, deployment config, `docs/STACK.md` | Reconcile automatically. |
| Environment variables | Typed configuration schemas                                  | Generate from schemas.   |
| API routes            | Route definitions and OpenAPI output                         | Generate from routes.    |
| Error codes           | Canonical error-code object                                  | Generate from source.    |
| Events                | Event schemas and registry                                   | Generate from source.    |
| Permissions           | Permission definitions                                       | Generate from source.    |
| Modules               | Module manifests                                             | Generate from manifests. |
| Services              | Nx projects and service manifests                            | Generate from source.    |
| Owners                | CODEOWNERS and project metadata                              | Generate or validate.    |

## Accuracy Rule

A reference document must identify:

- Its source.
- Whether it is generated or maintained manually.
- Its generation command.
- Its last successful generation.
- Whether CI verifies freshness.

A manually maintained inventory must not be labeled generated.

## Current Project Inventory

See [`Project Inventory.md`](./Project%20Inventory.md).
