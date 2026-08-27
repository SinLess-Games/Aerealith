# Discord Data Model

Discord persistence is isolated under `src/**/discord` and follows the same
UUID primary-key, timestamp, soft-lifecycle, mapper, query, repository, and
transaction conventions as the rest of `libs/db`.

## Identity and Snowflakes

Discord snowflakes are stored as decimal `varchar(20)` values and remain
strings at TypeScript boundaries. They must never be converted to JavaScript
numbers. `discord_accounts.user_account_id` is an optional link to the
canonical `user_accounts` record; canonical Aerealith users, authentication,
and `users.tier` remain authoritative.

## Guilds and Members

`discord_guild_members` is the current durable relationship between an
account and a guild. Leaving changes lifecycle state and writes a member event
instead of deleting the relationship. Rejoining reactivates that row,
increments its rejoin count, and records another event. Resource deletion and
bot uninstall use timestamps/state so moderation and analytics history remain.

## Sensitive Data

Age verification stores outcome, method, provider references, and opaque
object references only. Raw government identifiers and document images are
outside this relational boundary. Webhook credentials are represented by
secret-manager references. General age queries deliberately omit evidence and
provider references.

## Content and Analytics

Message metadata is independent of optional encrypted message content.
Content has an explicit policy and purge timestamp. Presence is represented by
aggregate snapshots, not an unbounded event stream. Guild, channel, and member
snapshots are the dashboard source so charts do not scan raw message, voice,
command, music, or AI events. Aggregate history survives raw-content expiry.

## Provenance

Discord source state, Aerealith configuration, user/moderator input, AI-derived
state, and analytics-derived state are separate tables or carry an explicit
provenance value. Forward-compatible Discord flags and low-value metadata use
typed JSON without replacing normalized product entities.
