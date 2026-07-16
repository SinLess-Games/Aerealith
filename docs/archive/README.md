# Documentation Archive

Status: Active
Owner: SinLess Games LLC
Last Updated: 2026-07-15
Document Type: Archive Index

## Purpose

This directory preserves historical documentation without allowing it to guide
new implementation.

Move a document here when it is superseded, rejected, obsolete, or retained only
to explain project history.

## Archive Categories

```text
docs/archive/
├── superseded/
├── rejected/
└── historical/
```

Create category directories only when the first real document is archived.

## Required Archive Banner

Every archived document must begin with:

```text
Status: Archived
Archived On: YYYY-MM-DD
Archive Reason:
Replacement:
Original Owner:
```

If no replacement exists, state that explicitly.

## Rules

- Never archive a document merely to avoid resolving a conflict.
- Update inbound links before moving a document.
- Do not edit archived reasoning except to correct factual or formatting errors.
- Add a new active decision when changing an accepted decision.
- Historical project names may appear only when clearly identified as history.
- Archived documents are excluded from active reading paths and implementation
  checklists.

## Deleted RFC References

The repository previously referenced RFC files that were later removed. Active
documents must not continue to cite those files as authority. Their unresolved
decisions must be represented by accepted records in `docs/decisions/` or by
active architecture and engineering documents.
