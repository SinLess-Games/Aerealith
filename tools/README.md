# Repository Tooling

Status: Active
Owner: Developer Experience
Last Updated: 2026-07-15
Document Type: Project Index

## Purpose

`tools/` contains repository-only generators, maintenance scripts, migration
utilities, validation, and developer-experience tooling.

Tooling is not a production runtime unless a specific project explicitly says
otherwise.

## Rules

- Prefer Nx generators for repeatable project creation.
- Generated output must follow architecture and engineering standards.
- Tools must not require production credentials for ordinary validation.
- Destructive tools provide dry-run or confirmation behavior.
- Tool output is deterministic where practical.
- Every significant tool has tests and a README.
