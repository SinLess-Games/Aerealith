# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-alpine AS base

ARG PNPM_VERSION

WORKDIR /app

# Corepack is no longer bundled with newer Node.js releases.
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

# Native toolchain required to build @datadog/pprof.
# This stage is discarded and does not become part of the runtime image.
RUN apk add --no-cache \
  g++ \
  make \
  python3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps/services/auth ./apps/services/auth
COPY libs ./libs

# Disable arbitrary dependency lifecycle scripts during installation.
#
# @datadog/pprof is explicitly rebuilt afterward because it requires its
# native build lifecycle.
RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  pnpm install \
  --frozen-lockfile \
  --ignore-scripts \
  --store-dir=/pnpm/store \
  && pnpm rebuild @datadog/pprof


# =============================================================================
# Runtime
# =============================================================================

FROM base AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

ENV NODE_ENV=production \
  HOME=/tmp

LABEL org.opencontainers.image.title="Aerealith Auth Service" \
  org.opencontainers.image.description="Production container for the Aerealith authentication service" \
  org.opencontainers.image.vendor="SinLess Games LLC"

# tini:
#   Handles PID 1 duties and forwards termination signals correctly.
#
# libstdc++:
#   Provides the runtime C++ library needed by native Node modules such as
#   @datadog/pprof without carrying the compiler toolchain into production.
#
# The service runs with a dedicated non-root UID/GID.
RUN apk add --no-cache \
  tini \
  libstdc++ \
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

# Keep application code and dependencies root-owned.
#
# The runtime account receives read/execute access only and therefore cannot
# modify its own application source or installed dependencies.

COPY --from=dependencies --chown=0:0 \
  /app/package.json \
  /app/pnpm-lock.yaml \
  /app/pnpm-workspace.yaml \
  /app/tsconfig.base.json \
  /app/

COPY --from=dependencies --chown=0:0 \
  /app/node_modules \
  /app/node_modules

COPY --from=dependencies --chown=0:0 \
  /app/apps/services/auth \
  /app/apps/services/auth

COPY --from=dependencies --chown=0:0 \
  /app/libs \
  /app/libs

RUN chmod -R u=rwX,go=rX \
  /app/node_modules \
  /app/apps/services/auth \
  /app/libs \
  && chmod 0644 \
  /app/package.json \
  /app/pnpm-lock.yaml \
  /app/pnpm-workspace.yaml \
  /app/tsconfig.base.json


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 3001

ENTRYPOINT ["tini", "--"]

CMD ["node", "dist/server.js"]
