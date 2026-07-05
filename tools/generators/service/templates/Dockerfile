# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
WORKDIR /workspace
RUN corepack enable

FROM base AS build
COPY . .
RUN --mount=type=cache,id=aerealith-pnpm-store,target=/pnpm/store,sharing=locked \
  pnpm install --frozen-lockfile
RUN pnpm exec nx run service-<%= serviceName %>:build
RUN mkdir -p "apps/services/<%= serviceName %>/dist" \
  && cp -R "dist/apps/services/<%= serviceName %>/." "apps/services/<%= serviceName %>/dist/"
RUN pnpm --filter "./apps/services/<%= serviceName %>" --prod --legacy deploy /deploy

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV="production"
ENV HOST="0.0.0.0"
ENV PORT="3000"
WORKDIR /app
COPY --from=build --chown=node:node /deploy ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
