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

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy the API workspace before installation so pnpm can resolve its workspace
# metadata and dependencies correctly.
COPY apps/services/api ./apps/services/api

RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile


# =============================================================================
# Runtime
# =============================================================================

FROM base AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

ENV NODE_ENV=production

LABEL org.opencontainers.image.title="Aerealith API" \
  org.opencontainers.image.description="Production container for the Aerealith Hono API service" \
  org.opencontainers.image.vendor="SinLess Games LLC"

# tini provides proper PID 1 behavior and forwards termination signals cleanly.
#
# A dedicated application account is used instead of root or the image's
# built-in node account so the runtime identity is explicit and predictable.
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
  aerealith \
  && mkdir -p /app \
  && chown -R aerealith:aerealith /app

# Copy installed dependencies and application sources from the dependency
# stage. Ownership is assigned directly during COPY so no additional recursive
# chown layer is required.
COPY --from=dependencies --chown=aerealith:aerealith \
  /app/node_modules \
  /app/node_modules

COPY --from=dependencies --chown=aerealith:aerealith \
  /app/package.json \
  /app/pnpm-lock.yaml \
  /app/pnpm-workspace.yaml \
  /app/

COPY --from=dependencies --chown=aerealith:aerealith \
  /app/apps/services/api \
  /app/apps/services/api


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

# Change this if the Hono service binds to a different container port.
EXPOSE 8788

ENTRYPOINT ["tini", "--"]

CMD ["pnpm", "exec", "tsx", "apps/services/api/src/main.ts"]
