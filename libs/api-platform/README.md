# API Platform

`@aerealith-ai/api-platform` is the transport composition layer for Aerealith
Hono services. One Hono application can expose HTTP routes, tRPC, GraphQL Yoga,
and runtime-specific WebSockets while sharing request identity,
authentication, logging, error handling, and lifecycle behavior.

The library contains no product-domain logic. Domain services remain plain
TypeScript and may be called independently by handlers for every transport.

## Dependency boundary

```text
apps/services/*
  -> @aerealith-ai/api-platform
  -> Hono / tRPC / GraphQL Yoga / WebSocket runtime adapter
  -> @aerealith-ai/core
  -> @aerealith-ai/auth (through application-supplied principal types)
```

Applications create and inject the production `Logger`; the platform only
depends on the `Logger` contract from core.

## Create an application

```ts
import { createApiApp, type ApiEnv, type ApiRequestContext } from '@aerealith-ai/api-platform';
import type { AuthPrincipal } from '@aerealith-ai/auth';

interface AuthContext extends ApiRequestContext<AuthPrincipal> {
  readonly authenticationService: AuthenticationService;
}

type AuthEnv = ApiEnv<AuthContext, ServiceBindings>;

const app = createApiApp<AuthEnv>({
  serviceName: 'auth',
  logger,
  resolvePrincipal: (request, context) => sessions.resolvePrincipal(request, context),
  createContext: (base) => ({
    ...base,
    authenticationService,
  }),
  health: true,
});
```

The platform accepts incoming `x-request-id` and `x-correlation-id` headers,
generates a request ID when needed, creates a child logger, resolves the
principal once, and stores the resulting context in Hono's typed
`apiContext` variable.

Optional middleware can exclude path prefixes such as `/ws` so
response-mutating CORS, compression, or secure-header middleware does not
damage immutable WebSocket upgrade responses.

## Register HTTP routes

```ts
mountHttpRoutes(app, {
  basePath: '/api/v1',
  register(router) {
    router.get('/account', (context) => {
      const api = context.get('apiContext');
      return context.json(accountService.get(api.principal));
    });
  },
});
```

`register` also accepts an array of registrars. Registrars receive an ordinary
Hono router and may mount nested routers.

## Mount tRPC

```ts
mountTrpc(app, {
  path: '/trpc',
  router: authRouter,
  createContext: (shared) => shared,
});
```

The Fetch adapter runs inside Hono. It receives the already-created shared
context, logs safe operation metadata without inputs, and masks internal
server error messages and stacks.

## Mount GraphQL

```ts
mountGraphql(app, {
  path: '/graphql',
  schema: authGraphqlSchema,
  createContext: (shared) => ({ api: shared }),
  graphiql: false,
  maskErrors: true,
  plugins: [],
});
```

Yoga and the schema are constructed once when routes are registered.
Fetch-compatible responses are returned unchanged, preserving streaming and
Server-Sent Events used by Yoga subscriptions.

## Mount WebSockets

```ts
mountWebSocketRoutes(app, {
  adapter: createCloudflareWebSocketAdapter(),
  routes: [
    {
      path: '/ws/auth',
      maxMessageBytes: 65_536,
      heartbeat: {},
      schema: authMessageSchema,
      authorize: (context) => context.principal !== undefined,
      onMessage: (message, connection, context) => {
        return authenticationService.handleRealtime(message, connection, context);
      },
    },
  ],
});
```

Messages use the versioned `{ version: 1, type, id?, payload }` envelope.
Invalid JSON, oversized payloads, and schema failures produce safe error
envelopes. Raw payloads are not logged. Connection context is captured at
upgrade and retained for the connection lifetime. Enabling `heartbeat`
provides application-level `ping`/`pong` envelopes with configurable message
type names.

The Cloudflare adapter is isolated under
`transports/websocket/adapters`. Hono's Cloudflare upgrader does not expose an
`onOpen` socket callback; the platform still records the accepted upgrade.
Adapters for runtimes that expose an open event should invoke the route's
`onOpen` callback. A new adapter implements `WebSocketAdapter`, registers each
route on the supplied Hono app, and maps its native socket to
`WebSocketConnection`.

GraphQL subscriptions remain on Yoga's default SSE transport. Generic
application WebSockets are independent.

## Register service modules

Modules may expose any transport subset:

```ts
registerApiModules(app, [
  {
    name: 'auth',
    httpBasePath: '/api/v1',
    registerHttp: registerAuthHttpRoutes,
    trpc: {
      path: '/trpc',
      router: authRouter,
      createContext: (shared) => shared,
    },
    graphql: {
      path: '/graphql',
      schema: authGraphqlSchema,
      createContext: (shared) => ({ api: shared }),
    },
    webSockets: {
      adapter: createCloudflareWebSocketAdapter(),
      routes: authWebSocketRoutes,
    },
  },
]);
```

Each handler calls shared domain services; transport handlers do not call one
another.

## Testing

`createTestApiContext`, `TestLogger`, and `InMemoryWebSocketAdapter` support
transport tests without production infrastructure or a runtime WebSocket
upgrader. Integration tests in this library demonstrate all four route types
coexisting in one application.
