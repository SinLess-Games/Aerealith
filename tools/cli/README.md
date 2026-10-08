# Aerealith CLI

Status: Active
Owner: Developer Experience
Last Updated: 2026-10-08
Document Type: Tool README

## Purpose

`@aerealith-ai/cli` is a private workspace CLI that wraps existing Nx tasks,
generators, and scripts behind one command (`aerealith`, alias `aer`).

## Usage

```sh
pnpm aerealith --help
pnpm aer affected test
pnpm aer new service demo --dry-run
```

Extra arguments are forwarded to the underlying command. `--dry-run` prints the
commands without running them.

## Command groups

- Tasks: `dev`, `check`, `fix`, `format`, `lint`, `typecheck`, `test`, `e2e`, `affected <task>`
- Scaffolding: `new service <name>`
- Data: `data download|process|pipeline`
- Database: `db generate|migrate|seed|studio`
- Docs: `docs headings|lint`, `license check`
- Deploy: `deploy frontend`

Commands are defined in `src/lib/commands.ts`.
