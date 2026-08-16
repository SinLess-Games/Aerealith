# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-alpine AS base

ARG PNPM_VERSION

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

WORKDIR /app

RUN corepack enable \
  && corepack prepare "pnpm@${PNPM_VERSION}" --activate


# =============================================================================
# Dependencies
# =============================================================================

FROM base AS dependencies

# Native build dependencies required by @datadog/pprof.
RUN apk add --no-cache \
  python3 \
  make \
  g++

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps/services/auth ./apps/services/auth
COPY libs ./libs

RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile \
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
#   Provides the runtime C++ library required by native Node modules such as
#   @datadog/pprof without carrying the compiler toolchain into production.
#
# The application receives a dedicated non-root UID/GID.
RUN apk add --no-cache \
  tini \
  libstdc++ \
  && addgroup \
  -S \
  -g "${APP_GID}" \
  aerealith \
  && adduser \
  -S \
  -D \
  -H \
  -u "${APP_UID}" \
  -G aerealith \
  aerealith


# =============================================================================
# Application
# =============================================================================

# Keep application code and dependencies owned by root.
#
# The runtime user only needs read/execute access. This prevents the
# application process from modifying its own source code or installed
# dependencies if it is compromised.

COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=dependencies /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=dependencies /app/tsconfig.base.json ./tsconfig.base.json

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/services/auth ./apps/services/auth
COPY --from=dependencies /app/libs ./libs


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 3001

ENTRYPOINT ["tini", "--"]

CMD ["pnpm", "exec", "tsx", "apps/services/auth/src/server.ts"]
