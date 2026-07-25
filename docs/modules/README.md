# Module Documentation

**Status:** Active  
**Owner:** SinLess Games LLC  
**Product:** Aerealith  
**Last Reviewed:** 2026-07-23  
**Implementation Status:** Planned

## Purpose

This directory is the authoritative catalog for Aerealith product modules.
Module records describe capability boundaries and do not prove that a runtime,
registry entry, Discord command, or persistence model exists.

No product-module registry or Discord integration runtime was found in the
repository during the 2026-07-23 review. Every module in this directory is
therefore **Planned**. Implemented Nx libraries and applications are projects,
not product modules; they are cataloged in the
[Project Inventory](../reference/Project%20Inventory.md).

## Documents

- [Discord Modules](./Discord%20Modules.md) — the eleven MVP-required modules,
  two MVP should-have modules, and the mandatory module-registry foundation
  accepted by DEC-002.

## Recommended Reading Order

1. [Module Architecture](../architecture/Module%20Architecture.md)
2. [DEC-002: Discord MVP Module Scope](../decisions/DEC-002-discord-mvp-module-scope.md)
3. [Discord Modules](./Discord%20Modules.md)
4. [Discord Architecture](../architecture/Discord%20Architecture.md)
5. [MVP Scope](../product/MVP%20Scope.md)

## Documentation Rule

A module may move from **Planned** only when its registry record, runtime
implementation, tests, configuration schema, permission behavior, audit
behavior, and disable behavior can be traced to repository paths.

## Related Documentation

- [Documentation Index](../README.md)
- [Product Index](../product/README.md)
- [Architecture Index](../architecture/README.md)
- [Release 0.1](../releases/0.1/README.md)
