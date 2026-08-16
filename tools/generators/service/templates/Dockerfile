# syntax=docker/dockerfile:1.25@sha256:0adf442eae370b6087e08edc7c50b552d80ddf261576f4ebd6421006b2461f12

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /workspace

RUN corepack enable \
  && corepack prepare "pnpm@${PNPM_VERSION}" --activate


# =============================================================================
# Build
# =============================================================================

FROM base AS build

# Support native Node dependencies such as @datadog/pprof.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY . .

RUN --mount=type=cache,id=aerealith-pnpm-store,target=/pnpm/store,sharing=locked \
  pnpm install --frozen-lockfile

RUN pnpm exec nx run service-<%= serviceName %>:build

# Keep the Nx output with the service before producing the isolated
# production deployment.
RUN mkdir -p "apps/services/<%= serviceName %>/dist" \
  && cp -R \
  "dist/apps/services/<%= serviceName %>/." \
  "apps/services/<%= serviceName %>/dist/"

# Produce a production-only deployment containing the service and its
# production dependencies.
RUN pnpm \
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

# tini provides correct PID 1 and signal handling.
#
# A dedicated runtime identity is used instead of root or the image's
# built-in node account. The application files remain root-owned and are
# therefore not writable by the running service.
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
# The runtime account only requires read/execute access.
COPY --from=build /deploy ./


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 3000

ENTRYPOINT ["tini", "--"]

CMD ["node", "dist/main.js"]
