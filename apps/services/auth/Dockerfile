# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-alpine AS base

ARG PNPM_VERSION

ENV CI=true \
  NODE_ENV=development

WORKDIR /workspace

# Corepack is no longer bundled with Node.js 25+.
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

# Native build dependencies are required by observability/profiling packages
# such as @datadog/pprof. They remain isolated to this build stage.
RUN apk add --no-cache \
  g++ \
  make \
  python3

# Copy workspace metadata first.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY nx.json tsconfig.base.json ./

# Copy only the auth files required to resolve the Nx project and compile it.
# Keeping the Dockerfile out of this layer preserves dependency-install cache
# reuse when the image assembly changes.
COPY apps/services/auth/package.json \
  apps/services/auth/project.json \
  apps/services/auth/tsconfig.app.json \
  apps/services/auth/tsconfig.json \
  apps/services/auth/worker-configuration.d.ts \
  ./apps/services/auth/
COPY apps/services/auth/src ./apps/services/auth/src
COPY libs ./libs

# Install the workspace dependency graph without automatically executing
# arbitrary dependency lifecycle scripts.
#
# Native dependencies that are explicitly trusted are rebuilt afterward.
RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  pnpm install \
  --frozen-lockfile \
  --ignore-scripts \
  --store-dir=/pnpm/store \
  && pnpm rebuild @datadog/pprof \
  && pnpm rebuild nx


# =============================================================================
# Compile
# =============================================================================

# Build the auth service and its upstream Nx library dependency graph.
RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  PNPM_CONFIG_STORE_DIR=/pnpm/store pnpm exec nx run service-auth:build \
  && test -f /workspace/dist/apps/services/auth/src/server.js


# =============================================================================
# Production deployment
# =============================================================================

# apps/services/auth/package.json expects:
#
#   ./dist/server.js
#
# The @nx/js compiler preserves the service's src directory, so copy its
# contents into the package's runtime dist directory before deployment.
RUN mkdir -p /workspace/apps/services/auth/dist \
  && cp -R \
  /workspace/dist/apps/services/auth/src/. \
  /workspace/apps/services/auth/dist/

# Produce an isolated production deployment containing only the auth service
# and its production dependency graph.
#
# Do not copy the monorepo root node_modules into the runtime image.
RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  PNPM_CONFIG_STORE_DIR=/pnpm/store pnpm \
  --config.inject-workspace-packages=true \
  --filter "@aerealith-ai/service-auth" \
  --prod \
  deploy \
  /deploy


# =============================================================================
# Compiled workspace libraries
# =============================================================================

# Aerealith workspace package manifests resolve their runtime entrypoints from
# ./src/*.js, while Nx places compiled output under dist/libs/<name>.
#
# Overlay compiled library output into each corresponding deployed workspace
# package so Node resolves JavaScript rather than TypeScript source.
RUN set -eux; \
  for lib in \
  api-platform \
  auth \
  authorization \
  core \
  db \
  observability \
  utils; \
  do \
  if [ -d "/workspace/dist/libs/${lib}" ]; then \
  find /deploy/node_modules/.pnpm \
  -type d \
  -path "*/node_modules/@aerealith-ai/${lib}" \
  -exec cp -R "/workspace/dist/libs/${lib}/." {} \;; \
  fi; \
  done

# Fail the image build immediately if the production entrypoint is missing.
RUN test -f /deploy/dist/server.js


# =============================================================================
# Runtime
# =============================================================================

FROM node:${NODE_VERSION}-alpine AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3001 \
  HOME=/tmp

LABEL org.opencontainers.image.title="Aerealith Auth Service" \
  org.opencontainers.image.description="Production container for the Aerealith authentication service" \
  org.opencontainers.image.vendor="SinLess Games LLC"

# tini:
#   Handles PID 1 duties and forwards termination signals correctly.
#
# libstdc++:
#   Provides the runtime C++ library required by native profiling modules
#   without shipping the compiler toolchain.
#
# npm/npx are removed from the production image because the running service
# does not require a package manager. This also reduces Trivy's runtime
# vulnerability surface.
#
# The service runs under a dedicated non-root UID/GID.
RUN apk add --no-cache \
  libstdc++ \
  tini \
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
  aerealith \
  && rm -rf \
  /usr/local/lib/node_modules/npm \
  /usr/local/bin/npm \
  /usr/local/bin/npx


# =============================================================================
# Application
# =============================================================================

WORKDIR /app

# Keep the deployed application and dependencies root-owned.
#
# The runtime account receives read/execute access only and cannot modify its
# own code or installed dependencies.
COPY --from=build --chown=0:0 /deploy ./


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health >/dev/null || exit 1

ENTRYPOINT ["tini", "--"]

CMD ["node", "dist/server.js"]
