# syntax=docker/dockerfile:1.25@sha256:0adf442eae370b6087e08edc7c50b552d80ddf261576f4ebd6421006b2461f12

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION

WORKDIR /workspace

# Corepack is no longer bundled with newer Node.js releases.
# Install the exact pnpm version directly.
RUN npm install \
  --global \
  --ignore-scripts \
  "pnpm@${PNPM_VERSION}" \
  && pnpm --version \
  && npm cache clean --force


# =============================================================================
# Build
# =============================================================================

FROM base AS build

# Native compilation support is isolated to the build stage and never copied
# into the production image.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  g++ \
  make \
  python3 \
  && rm -rf /var/lib/apt/lists/*

COPY . .

# Do not automatically execute dependency lifecycle scripts during installation.
#
# @datadog/pprof is explicitly rebuilt only when it exists in this workspace,
# allowing auth services to use the native profiler without forcing every
# generated service to depend on it.
RUN --mount=type=cache,id=aerealith-pnpm-store,target=/pnpm/store,sharing=locked \
  pnpm install \
  --frozen-lockfile \
  --ignore-scripts \
  --store-dir=/pnpm/store \
  && if pnpm list --recursive --depth=0 @datadog/pprof 2>/dev/null \
  | grep -q '@datadog/pprof'; then \
  pnpm rebuild @datadog/pprof; \
  fi \
  && pnpm exec nx run service-<%= serviceName %>:build \
  && test -d "dist/apps/services/<%= serviceName %>" \
  && mkdir -p "apps/services/<%= serviceName %>/dist" \
  && cp -R \
  "dist/apps/services/<%= serviceName %>/." \
  "apps/services/<%= serviceName %>/dist/" \
  && pnpm \
  --filter "./apps/services/<%= serviceName %>" \
  --prod \
  --legacy \
  deploy \
  /deploy


# =============================================================================
# Runtime
# =============================================================================

FROM node:${NODE_VERSION}-bookworm-slim AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

ENV NODE_ENV="production" \
  HOST="0.0.0.0" \
  PORT="3000" \
  HOME="/tmp"

LABEL org.opencontainers.image.title="Aerealith <%= serviceName %> Service" \
  org.opencontainers.image.description="Production container for the Aerealith <%= serviceName %> service" \
  org.opencontainers.image.vendor="SinLess Games LLC"

# tini:
#   Provides correct PID 1 behavior and forwards termination signals to Node.
#
# ca-certificates:
#   Provides trusted system CAs for outbound TLS.
#
# libstdc++6:
#   Provides the runtime C++ library required by native Node modules such as
#   @datadog/pprof without shipping the compiler toolchain.
#
# The generated service receives its own explicit non-root runtime identity.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  ca-certificates \
  libstdc++6 \
  tini \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd \
  --gid "${APP_GID}" \
  aerealith \
  && useradd \
  --uid "${APP_UID}" \
  --gid "${APP_GID}" \
  --no-create-home \
  --home-dir /nonexistent \
  --shell /usr/sbin/nologin \
  aerealith


# =============================================================================
# Application
# =============================================================================

WORKDIR /app

# Keep the deployed application root-owned.
#
# The service process can read and execute its application but cannot modify
# its own code or production dependencies if compromised.
COPY --from=build --chown=0:0 /deploy ./

RUN chmod -R u=rwX,go=rX /app


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 3000

ENTRYPOINT ["tini", "--"]

CMD ["node", "dist/main.js"]
