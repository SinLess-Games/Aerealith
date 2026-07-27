FROM node:24-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/services/auth ./apps/services/auth
RUN corepack enable && pnpm install --frozen-lockfile
CMD ["pnpm", "exec", "tsx", "apps/services/auth/src/main.ts"]
