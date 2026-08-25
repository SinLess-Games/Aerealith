# Auth

Runtime-neutral authentication services for Aerealith.

The library uses `@aerealith-ai/core` as its source of truth for users,
sessions, errors, roles, tiers, and lifecycle state. Its repository ports are
structurally compatible with the user repositories exported by
`@aerealith-ai/db`; applications provide hashing, token generation, event
publishing, and database adapters at composition time.

```ts
import { PasswordAuthenticationService, SessionService } from '@aerealith-ai/auth';
```

Raw passwords and session tokens are never persisted by this library. The db
layer receives password hashes and session-token digests only.
