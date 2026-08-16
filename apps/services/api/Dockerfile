# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-alpine AS base

ARG PNPM_VERSION

WORKDIR /app

# Corepack is no longer bundled with Node.js 25+.
# Install the exact pnpm version directly.
RUN npm install \
  --global \
  --ignore-scripts \
  "pnpm@${PNPM_VERSION}" \
  && pnpm --version


# =============================================================================
# Dependencies
# =============================================================================

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the API workspace before installation so pnpm can resolve its workspace
# metadata and dependencies correctly.
COPY apps/services/api ./apps/services/api

RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  pnpm install \
  --frozen-lockfile \
  --ignore-scripts \
  --store-dir=/pnpm/store


# =============================================================================
# Runtime
# =============================================================================

FROM base AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=8788 \
  HOME=/tmp

LABEL org.opencontainers.image.title="Aerealith API" \
  org.opencontainers.image.description="Production container for the Aerealith Hono API service" \
  org.opencontainers.image.vendor="SinLess Games LLC"

# tini provides proper PID 1 behavior and signal forwarding.
#
# The application uses a dedicated non-root UID/GID. Application files remain
# root-owned so the running process cannot modify its own source or dependencies.
RUN apk add --no-cache tini \
  && addgroup \
  --system \
  --gid "${APP_GID}" \
  aerealith \
  && adduser \
  --system \
  --disabled-password \
  --no-create-home \
  --uid "${APP_UID}" \
  --ingroup aerealith \
  aerealith


# =============================================================================
# Application
# =============================================================================

# Keep application dependencies and source root-owned.
# The runtime account only needs read/execute access.

COPY --from=dependencies --chown=0:0 \
  /app/node_modules \
  /app/node_modules

COPY --from=dependencies --chown=0:0 \
  /app/package.json \
  /app/pnpm-lock.yaml \
  /app/pnpm-workspace.yaml \
  /app/

COPY --from=dependencies --chown=0:0 \
  /app/apps/services/api \
  /app/apps/services/api

RUN chmod -R u=rwX,go=rX \
  /app/node_modules \
  /app/apps/services/api \
  && chmod 0644 \
  /app/package.json \
  /app/pnpm-lock.yaml \
  /app/pnpm-workspace.yaml


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 8788

ENTRYPOINT ["tini", "--"]

CMD ["pnpm", "exec", "tsx", "apps/services/api/src/main.ts"]
