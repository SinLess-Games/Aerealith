FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/services/api ./apps/services/api
RUN corepack enable && pnpm install --frozen-lockfile
CMD ["pnpm", "exec", "tsx", "apps/services/api/src/main.ts"]
