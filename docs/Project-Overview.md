# Project Overview

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-18
Document Type: Project Overview
Authority: Canonical high-level introduction

## Purpose

This document is the primary introduction to Aerealith for contributors,
developers, community members, partners, and supporters. It explains what the
project is, why it exists, how its names relate, and where verified detail
lives.

For implementation status, use [Current State](./CURRENT_STATE.md). For company,
legal, and naming context, use
[Company and Project Structure](./Company-and-Project-Structure.md).

## Executive Summary

**Aerealith** is a modular digital platform designed to reduce the complexity of
modern digital life. It aims to connect applications, communities, data,
workflows, automation, and intelligent capabilities through one trusted,
user-controlled layer.

The long-term vision is:

> **Aerealith is the operating system for your digital life.**

That statement is a product direction, documented in
[Vision](./vision/Vision.md) and [Positioning](./vision/Positioning.md), not a
claim that every planned capability is available today.

**Aerealith AI** is the assistant within Aerealith. It helps users understand
information, coordinate workflows, review recommendations, and perform actions
within explicit permissions and approval boundaries. Its scope is defined in
[AI Assistant](./product/AI%20Assistant.md) and
[DEC-003](./decisions/DEC-003-mvp-ai-assistant-boundaries.md).

## Company and Product Relationship

The canonical hierarchy is:

```text
SinLess Industries
`-- SinLess Games LLC
    `-- Aerealith
        `-- Aerealith AI
```

SinLess Industries is the operating umbrella. SinLess Games LLC is the legal
company currently identified for development, publication, contracts, policies,
funding, and copyright. Aerealith is the platform, and Aerealith AI is the
assistant within it.

See [Company and Project Structure](./Company-and-Project-Structure.md) for the
complete legal, organizational, contributor, and public-naming rules.

## The Problem

Modern digital life is fragmented across applications, dashboards, services,
communities, notifications, automations, and AI tools. People spend increasing
time switching contexts, duplicating information, rebuilding permissions, and
maintaining disconnected workflows.

Technology has become more capable while managing it has become more difficult.

## The Product Direction

Aerealith is intended to connect existing services rather than replace them
without cause. The platform direction includes:

- Shared identity and permission boundaries.
- Connected applications and community operations.
- Modular capabilities and integrations.
- User-controlled workflows and automation.
- Explainable, auditable actions.
- Aerealith AI assistance within explicit trust boundaries.
- Replaceable external providers where practical.
- Hosted service and future self-hosted deployment paths.

The integration, modularity, and provider-boundary principles come from
[Product Philosophy](./vision/Product%20Philosophy.md) and
[DEC-011](./decisions/DEC-011-platform-providers-vs-integrations.md).
Self-hosting is a future direction in the
[Roadmap](./vision/Roadmap.md), not a currently available distribution.

## Canonical Product Distinction

### Aerealith

Aerealith is the platform. It provides or is intended to provide the shared
foundation for identity, permissions, integrations, workflows, modules,
security, auditability, observability, and user-facing experiences.

### Aerealith AI

Aerealith AI is the intelligent assistant inside Aerealith. It may explain,
recommend, summarize, coordinate, and perform approved actions. It does not
possess unrestricted authority and must remain useful within the platform's
[Trust Model](./vision/Trust%20Model.md).

The names are not interchangeable in technical, legal, or authoritative
documentation.

## Platform Principles

### User Control

Users remain in control of their data, permissions, automations, and connected
services. See [Trust Model](./vision/Trust%20Model.md).

### Progressive Trust

Automation earns authority through explicit scope, approvals, observable
behavior, and revocation. Trust is not assumed.

### Transparency

Meaningful actions should be explainable, auditable, and understandable.

### Integration Before Replacement

Aerealith connects existing tools when practical instead of recreating every
service.

### Modularity

Capabilities should remain independently understandable and configurable.

### Security

Security, privacy, permissions, and auditability are product behavior rather
than later additions.

### Provider Independence

Critical provider dependencies should remain replaceable where practical.
Provider-neutral platform boundaries are defined in
[DEC-011](./decisions/DEC-011-platform-providers-vs-integrations.md).

## Initial Product Focus

Aerealith begins with a focused proof of its wider platform direction.

### Individuals

The long-term individual experience is a trusted control center for connected
digital tools, information, and workflows.

### Discord Communities

Discord is the first flagship integration, as documented in the
[Roadmap](./vision/Roadmap.md),
[Discord Platform](./product/Discord%20Platform.md), and
[DEC-014](./decisions/DEC-014-mvp-persona-priority.md).

This is a delivery priority, not the complete identity of Aerealith and not a
claim that all planned Discord capabilities are implemented.

## Current and Planned Capabilities

The platform direction includes community management, integrations, workflows,
notifications, developer APIs, modules, marketplace capabilities, audit
logging, Aerealith AI, hosted deployment, and future self-hosting.

Not every capability is implemented. Use these sources to keep claims honest:

- [Current State](./CURRENT_STATE.md) for the concise present-versus-planned
  boundary.
- [Current Architecture](./architecture/Current%20Architecture.md) for current
  repository truth.
- [Project Inventory](./reference/Project%20Inventory.md) for exact implemented
  Nx projects.
- [MVP Scope](./product/MVP%20Scope.md) for accepted product boundaries.
- [Roadmap](./vision/Roadmap.md) for planned sequencing.
- [Release 0.1](./releases/0.1/README.md) for the current foundation milestone.

A capability described in product, roadmap, funding, or target architecture
material must not be presented as live without implementation evidence.

## Technology Overview

Aerealith is currently a TypeScript and Nx monorepo. Its implemented foundation
includes React, Vite, React Router, Tailwind CSS, Vitest, Playwright, Hono,
Drizzle ORM, PostgreSQL, and Cloudflare-oriented deployment tooling.

Technology status and approval live in the
[Stack](./STACK.md). Exact installed versions live in `package.json`, the
lockfile, and runtime pin files. Planned technologies must remain labeled as
planned.

## Development Approach

Aerealith is developed incrementally with foundations, trust, secure identity,
reliable integrations, documentation, testing, and operational readiness ahead
of broad feature expansion.

The architecture is intentionally modular and should remain useful without
requiring AI for every task. Significant technical choices are recorded in the
[Decision Register](./decisions/README.md).

## Success

Aerealith succeeds when it reduces digital complexity without reducing user
control. Feature count alone is not success. The platform should remain:

- Trustworthy and secure.
- Transparent and explainable.
- Modular and maintainable.
- Extensible without uncontrolled authority.
- Respectful of user data and permissions.
- Useful to users, communities, and developers.

## Where to Go Next

### Understand the Direction

1. [Vision](./vision/Vision.md)
2. [Product Philosophy](./vision/Product%20Philosophy.md)
3. [Trust Model](./vision/Trust%20Model.md)
4. [Roadmap](./vision/Roadmap.md)
5. [Product Overview](./product/Product%20Overview.md)

### Understand the Repository

1. [Current State](./CURRENT_STATE.md)
2. [Current Architecture](./architecture/Current%20Architecture.md)
3. [Approved Technology Stack](./STACK.md)
4. [Project Inventory](./reference/Project%20Inventory.md)
5. [Decision Register](./decisions/README.md)

### Start Contributing

1. [Documentation Index](./README.md)
2. [Local Development](./engineering/Local%20Development.md)
3. [Monorepo Rules](./engineering/Monorepo%20Rules.md)
4. [Testing](./engineering/Testing.md)
5. [Release Index](./releases/README.md)
6. [Current Release 0.1](./releases/0.1/README.md)

## Final Statement

Aerealith is an effort to build a trustworthy platform that helps people manage
an increasingly complex digital world without sacrificing ownership,
transparency, or control.

It is developed by SinLess Games LLC and operated under SinLess Industries.
