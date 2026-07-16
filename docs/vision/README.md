# Vision Documentation

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Vision Index

## Purpose

The vision directory defines why Aerealith exists, what it stands for, how it
earns trust, and what direction must survive implementation changes.

Vision documentation guides product, architecture, engineering, release
planning, contributor expectations, and public messaging. It does not define
exact package versions, source paths, database schemas, or API routes.

## Reading Order

1. [Vision](./Vision.md)
2. [Mission](./Mission.md)
3. [Core Values](./Core%20Values.md)
4. [Product Philosophy](./Product%20Philosophy.md)
5. [Trust Model](./Trust%20Model.md)
6. [Positioning](./Positioning.md)
7. [Manifesto](./Manifesto.md)
8. [Roadmap](./Roadmap.md)

## North Star

> Reduce digital complexity without reducing user control.

## Core Ideas

- Aerealith is the operating system for your digital life.
- Trust is earned rather than assumed.
- Users and communities own their data.
- AI enhances the platform but does not hold it hostage.
- Meaningful actions are permissioned, explainable, auditable, and revocable.
- Integrate before replacing.
- Cohesion is more valuable than a pile of disconnected features.
- Discord is the first flagship integration, not the limit of the platform.
- Architecture should start simple without creating dead ends.
- Provider dependencies should remain replaceable where practical.
- Every major capability should become API-accessible where appropriate.

## Change Policy

Small wording improvements may update an active vision document.

A material change to mission, trust, ownership, user control, product category,
or long-term direction requires:

- A stated reason.
- Impact analysis across product and architecture.
- A decision record when the change resolves or reverses a binding choice.
- Updates to affected reading paths and public messaging.

## Relationship to Other Documentation

```text
vision
├── guides product priorities
├── constrains architecture
├── constrains engineering standards
├── informs decisions
└── shapes release goals
```

When an implementation idea conflicts with the vision, pause and either change
the implementation or intentionally revise the vision through the documented
decision process.
