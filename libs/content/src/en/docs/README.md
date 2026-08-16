# Documentation authoring

Documentation lives in `libs/content/src/en/docs/user` and `libs/content/src/en/docs/developer`. A path maps directly beneath `/documentation`: `user/example/index.mdx` becomes `/documentation/user/example`, while `developer/api/webhooks.mdx` becomes `/documentation/developer/api/webhooks`. An `index.mdx` is the landing page for its containing folder and supplies that folder's label, description, and order.

Every page requires `title` and `description`. Optional fields are `order` (default `999`), `audience`, `keywords` (default `[]`), `draft` (default `false`), `hidden` (default `false`), `icon`, `badge`, and an ISO date-time `updated`. If supplied, `audience` must match the first directory. Siblings sort by `order`, then title. Hidden pages remain directly reachable but leave navigation; production drafts leave navigation and search.

Link to another page with its absolute `/documentation/...` URL. Put images in `apps/frontend/public` and reference them from `/`. MDX has standard Fumadocs elements plus `Requirement`, `Warning`, `SecurityNote`, `PermissionTable`, `ApiEndpoint`, and `ArchitectureDecision`.

Preview with `pnpm exec nx dev frontend`. Validate with `pnpm exec nx test frontend`, `pnpm exec nx typecheck frontend`, and `pnpm exec nx build frontend`.

```mdx
---
title: Honorable Mentions
description: People and projects that helped shape Aerealith.
order: 20
audience: user
keywords:
  - credits
  - contributors
draft: false
hidden: false
---

## Community contributors

Write the page here.
```
