# Frontend End-to-End Tests

Status: Active
Owner: Frontend Platform
Last Updated: 2026-07-15
Project Type: Nx test application
Runtime: Playwright
Nx Project: `frontend-e2e`
Implicit Dependency: `frontend`

## Purpose

This project validates Aerealith through real browser flows.

It covers behavior that unit tests cannot prove alone, including routing,
authentication state, accessibility, approvals, configuration, error recovery,
and cross-surface workflows.

## Commands

```bash
pnpm nx e2e frontend-e2e
pnpm nx show project frontend-e2e
```

Use repository-supported Playwright arguments only after checking the target
help or project configuration.

## Test Principles

- Prefer stable user-facing selectors.
- Keep tests independent and deterministic.
- Do not require production credentials.
- Use fake or isolated providers by default.
- Avoid fixed sleeps; wait for observable state.
- Capture useful traces and screenshots on failure.
- Test server rejection, not only hidden buttons.
- Include accessibility assertions on critical routes.

## Required Critical Flows

- Public and authenticated route behavior.
- Account and session management.
- Discord connection and permission review when available.
- Module enable, configure, disable, and re-enable.
- Approval for high-risk actions.
- Audit-log visibility.
- AI-disabled degradation.
- Integration disconnect and revocation.
