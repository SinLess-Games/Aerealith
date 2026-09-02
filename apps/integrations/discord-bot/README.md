# Aerealith Discord Bot

The Aerealith Discord bot is a Node.js, TypeScript, Discord.js, and Sapphire
integration. This application owns Discord process behavior and bot-specific
adapters. Reusable business contracts, persistence, authorization, utilities,
and telemetry belong in Nx libraries.

The current implementation is an architectural foundation. It connects one
standalone or hybrid-sharded worker, configures Sapphire, registers health and
shutdown behavior, and deliberately does not implement speculative commands,
music, queues, or Redis adapters.

## Current architecture

```text
apps/integrations/discord-bot/
├── src/
│   ├── bootstrap/
│   │   └── bootstrap.ts
│   ├── client/
│   │   ├── aerealith-discord-client.ts
│   │   ├── client-options.spec.ts
│   │   └── client-options.ts
│   ├── config/
│   │   ├── discord-bot.config.spec.ts
│   │   └── discord-bot.config.ts
│   ├── framework/
│   │   ├── listeners/
│   │   │   └── client-ready.listener.ts
│   │   └── register-plugins.ts
│   ├── health/
│   │   ├── discord-gateway.health.spec.ts
│   │   └── discord-gateway.health.ts
│   ├── lifecycle/
│   │   ├── install-signal-handlers.spec.ts
│   │   └── install-signal-handlers.ts
│   ├── observability/
│   │   ├── sapphire-logger.adapter.spec.ts
│   │   └── sapphire-logger.adapter.ts
│   ├── sharding/
│   │   ├── shard-context.spec.ts
│   │   └── shard-context.ts
│   └── main.ts
├── eslint.config.mjs
├── jest.config.cts
├── project.json
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json
```

Directories that do not yet own working code are intentionally absent. Add
them when the first corresponding feature is implemented, following the
placement rules below.

## Process architecture

```text
main.ts
  -> bootstrapDiscordBot()
     -> validate environment
     -> resolve standalone or managed shard allocation
     -> initialize shared observability
     -> register Sapphire plugins
     -> construct the Discord client
     -> register health and shutdown handlers
     -> connect to the Discord gateway
```

`main.ts` is only an entrypoint and last-resort startup error boundary.
`bootstrap/bootstrap.ts` owns orchestration, not business logic. Discord and
Sapphire are dynamically loaded after observability so supported network
instrumentation can initialize first.

## Dependency direction

Dependencies flow inward through stable boundaries:

```text
entrypoint
  -> bootstrap
     -> client / framework / feature modules
        -> feature services
           -> repositories / integration clients
              -> shared Nx libraries and external systems
```

The reverse directions are forbidden:

- features do not import bootstrap code;
- infrastructure does not import commands or interaction handlers;
- commands do not issue raw database queries;
- other projects do not import this application's internals;
- reusable code moves to `libs/` and receives a public Nx alias.

Avoid broad barrel chains. A feature may expose one intentional `index.ts`
boundary, but internal files should use direct relative imports.

## Current directory responsibilities

### `bootstrap/`

Coordinates startup and composes dependencies. New Redis, API, Lavalink, or
queue initialization belongs here only as orchestration calls into their owned
adapters. It must not contain command or domain decisions.

### `client/`

Owns the Aerealith Sapphire client and all Discord `ClientOptions`. Intents,
partials, prefixes, framework logging, and shard allocation are configured in
one place. Privileged intents are opt-in through validated configuration.

### `config/`

Is the only bot-local parser for environment variables. It uses Zod and
returns a typed immutable shape. `toSafeDiscordBotConfig()` omits the Discord
token for diagnostics. Do not read `process.env` from commands, services, or
adapters.

### `framework/`

Contains reusable Sapphire mechanics rather than product features. The current
framework root registers plugins and the global ready listener. Sapphire uses
this directory as its `baseUserDirectory`.

When the first domain feature is added, register that feature root with
`client.stores.registerPath(featureRoot)` before `login()`. This lets Sapphire
discover its `commands`, `listeners`, `interaction-handlers`, and
`preconditions` directories while the feature remains cohesive.

### `health/`

Contains Discord-specific checks built on the shared observability health
registry. Future checks may cover shard readiness, Redis, Lavalink, the
Aerealith API, and BullMQ workers. Generic health aggregation stays in
`@aerealith-ai/observability`.

### `lifecycle/`

Owns process signal adaptation. Actual shutdown coordination uses the shared
observability lifecycle registry. Future resources must register named,
idempotent close handlers for the Discord client, cluster IPC, Lavalink,
Redis, queues, workers, and HTTP clients.

### `observability/`

Contains only bot-specific adapters. The Sapphire adapter sends framework logs
through Aerealith's structured logger, redaction, Pino/Loki sinks, Sentry, and
OpenTelemetry stack. Generic metrics, tracing, correlation context, health,
and shutdown remain in `libs/observability`.

Future bot metrics should use bounded labels such as command name, outcome,
interaction type, and shard ID. Never use user IDs, guild IDs, message content,
or correlation IDs as metric labels.

### `sharding/`

Treats shard allocation as process infrastructure. `shard-context.ts` supports
standalone execution and validates allocation supplied by
`discord-hybrid-sharding`. Managed workers construct a `ClusterClient` for
future IPC.

The cluster manager is intentionally not implemented yet. When operational
requirements are defined, add a separate `sharding/manager.ts` entrypoint and
Nx target that spawns the compiled worker. Manager lifecycle, resharding,
cross-shard messaging, statistics, and health must remain independent of
commands. Use `@discordjs/brokers` or Redis only behind an explicit IPC or
coordination interface.

## Feature modules

Product functionality is grouped by domain under `src/features/`. Do not
create a top-level collection containing every command or event in the bot.

For example, the first real moderation capability may create:

```text
src/features/moderation/
├── commands/
│   └── ban.command.ts
├── services/
│   └── moderation.service.ts
├── preconditions/
│   └── moderate-members.precondition.ts
└── index.ts
```

Only add the directories used by that implementation. Feature-specific
buttons, modals, listeners, schemas, repositories, and constants remain under
the same feature.

Likely future feature roots include `administration`, `moderation`, `guilds`,
`users`, `utility`, `roles`, `onboarding`, `notifications`, and `ai`. Their
names are planning guidance, not directories to create preemptively.

## Commands and interactions

A logical command should share application logic across chat-input, message,
context-menu, subcommand, and autocomplete entrypoints. Sapphire command
classes are transport adapters, not business services.

A command should normally:

1. validate Discord input;
2. establish user and guild context;
3. enforce application and Discord authorization;
4. invoke a feature service;
5. format the Discord response.

Shared framework mechanics for registration, common arguments, or reusable
interaction routing belong under `framework/`. Feature-specific autocomplete,
buttons, selects, and modals belong in the owning feature. Create a top-level
`interactions/` directory only when multiple domains genuinely share routing
infrastructure.

## Events

Global framework and gateway lifecycle listeners belong under
`framework/listeners/`. A listener implementing moderation, guild setup,
notifications, or another domain behavior belongs in that feature's
`listeners/` directory. Prefer descriptive names such as
`guild-create.listener.ts` and `member-remove.listener.ts`.

## Music and voice

Music is large enough to become `src/music/` when implementation begins. Keep
generic music state separate from Lavalink transport details:

```text
src/music/
├── commands/
├── interactions/
├── lavalink/
│   ├── lavalink-client.ts
│   ├── lavalink-events.ts
│   └── lavalink-nodes.ts
├── players/
│   └── player-manager.ts
├── queues/
│   └── music-queue.ts
└── services/
    └── music.service.ts
```

Reconnect/recovery and voice state must be shard-aware. Generic non-music
voice functionality may later create a separate `src/voice/` domain rather
than depending on Lavalink.

## Redis, cache, queues, and jobs

There is no shared Redis or BullMQ Nx library today. When required:

- place bot-specific Redis connection adaptation in `infrastructure/redis/`;
- place distributed key and TTL policy in `cache/` or the owning feature;
- place BullMQ queue definitions, producers, workers, and processors in
  `queues/`;
- place scheduled or asynchronous task definitions in `jobs/` or the owning
  feature.

A queue is transport/execution infrastructure; a job is application work.
Processors call services and must not contain unrelated domain logic.

State that must apply across shards—global cooldowns, leases, deduplication,
and distributed locks—cannot use a process-local `Map`. Local caches are
allowed only when explicitly documented as shard-local and disposable.

If another application needs the same Redis or BullMQ abstraction, promote it
to a focused Nx library rather than copying it.

## Persistence and Aerealith integrations

The shared database library already contains Discord schema, queries,
transactions, and repositories. Feature services should consume public
`@aerealith-ai/db` contracts or an application-specific repository adapter;
commands must not query Drizzle directly.

Calls to Aerealith services will live behind a typed client under
`integrations/aerealith/`, using `openapi-fetch` when the API schema is ready.
Do not scatter raw `fetch` calls through commands. Discord REST helpers shared
across domains may live under `integrations/discord-api/`.

## Authorization and security

Reuse `@aerealith-ai/authorization` for application permissions and contracts.
Discord permission checks, owner checks, command preconditions, cooldowns, and
distributed rate limits belong in the owning feature or a future
`security/` boundary when multiple features share them.

Never log tokens, authorization headers, interaction payload bodies, message
content, database URLs, Redis URLs, cookies, or arbitrary request bodies.
Discord and Sentry context should be minimal and redacted. PII collection is
opt-in.

## Configuration

Local examples are documented in the workspace `.env.example`:

| Variable                              | Purpose                                     |
| ------------------------------------- | ------------------------------------------- |
| `DISCORD_TOKEN`                       | Discord secret; required at runtime         |
| `DISCORD_ENABLE_MESSAGE_COMMANDS`     | Enables prefix commands and Message Content |
| `DISCORD_DEFAULT_PREFIX`              | Prefix used when message commands are on    |
| `DISCORD_ENABLE_GUILD_MEMBERS_INTENT` | Opt-in privileged member intent             |
| `DISCORD_SHUTDOWN_TIMEOUT_MS`         | Graceful shutdown deadline                  |
| `CLUSTER_MANAGER_MODE`                | Supplied by hybrid sharding managed workers |

Production injects secrets through the deployment platform. Never commit a
real Discord token or copy configuration objects containing it into logs.

## Shared libraries

Use public Nx aliases instead of application-relative imports:

| Library                       | Bot responsibility reused                           |
| ----------------------------- | --------------------------------------------------- |
| `@aerealith-ai/observability` | logging, Sentry, metrics, tracing, health, shutdown |
| `@aerealith-ai/db`            | Discord persistence and repositories                |
| `@aerealith-ai/authorization` | application permission contracts and policies       |
| `@aerealith-ai/auth`          | shared authentication/session contracts when needed |
| `@aerealith-ai/core`          | cross-application models and contracts              |
| `@aerealith-ai/utils`         | redaction, identifiers, and generic utilities       |

Do not import directly from another application. If the bot and another
application need the same API client, Redis adapter, queue contract, or
Discord-neutral service, promote that code to `libs/`.

## Testing

Unit tests are colocated with implementation, matching the generated Jest
project and existing TypeScript conventions. Tests must not require a Discord
token or network access. Inject narrow interfaces for Discord, Redis, queues,
Lavalink, API clients, and clocks.

Create `tests/integration/`, `tests/fixtures/`, or `tests/helpers/` only when
cross-module tests need those shared assets. External integration tests should
use deterministic fakes or isolated containers and remain separate from unit
tests.

Useful commands:

```bash
pnpm nx show project discord-bot
pnpm nx run discord-bot:typecheck
pnpm nx run discord-bot:lint
pnpm nx run discord-bot:test
pnpm nx run discord-bot:build
pnpm nx run discord-bot:serve:development
```

`serve` requires a valid `DISCORD_TOKEN`. Unit tests and static validation do
not.

## Placement guide

| New code                                       | Destination                                   |
| ---------------------------------------------- | --------------------------------------------- |
| Slash, prefix, or context-menu command         | `features/<domain>/commands/`                 |
| Feature button, select, modal, or autocomplete | `features/<domain>/interactions/`             |
| Shared interaction routing                     | `interactions/` when a second domain needs it |
| Global Discord/Sapphire lifecycle listener     | `framework/listeners/`                        |
| Feature event behavior                         | `features/<domain>/listeners/`                |
| Lavalink nodes and reconnect behavior          | `music/lavalink/`                             |
| Music queue and player state                   | `music/queues/` and `music/players/`          |
| BullMQ transport or processor                  | `queues/`                                     |
| Scheduled/maintenance task                     | `jobs/` or the owning feature                 |
| Guild settings business logic                  | `features/guilds/services/`                   |
| Bot-specific repository adapter                | owning feature, or `repositories/` if shared  |
| Redis-backed distributed state                 | `infrastructure/redis/` plus owning policy    |
| Aerealith service client                       | `integrations/aerealith/`                     |
| Bot metrics or framework telemetry adapter     | `observability/`                              |
| Gateway, shard, Redis, API, or Lavalink check  | `health/`                                     |
| Graceful process signal behavior               | `lifecycle/`                                  |

## Next implementation step

Add one small domain feature—preferably a read-only utility/status chat-input
command—to establish the feature registration mechanism, command testing
factory, application-command deployment policy, and authorization pipeline.
Do that before introducing music, Redis, BullMQ, or a cluster manager so the
core command boundary is proven with minimal operational complexity.
