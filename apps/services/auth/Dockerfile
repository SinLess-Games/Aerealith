FROM node:26.5.0-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps/services/auth ./apps/services/auth
COPY libs ./libs
RUN apk add --no-cache --virtual .profile-build-deps python3 make g++ \
  && corepack enable \
  && pnpm install --frozen-lockfile \
  && pnpm rebuild @datadog/pprof \
  && apk del .profile-build-deps
EXPOSE 3001
CMD ["pnpm", "exec", "tsx", "apps/services/auth/src/server.ts"]
