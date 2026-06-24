# syntax=docker/dockerfile:1.7

# Build from the repository root:
# docker build \
#   --file apps/frontend/Dockerfile \
#   --tag aerealith-frontend:local \
#   .

# ==============================================================================
# Build
# ==============================================================================

FROM node:25.9.0-alpine AS build

WORKDIR /workspace

ENV CI=true
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Native build tools keep workspace installs reliable when dependencies include
# optional native modules.
RUN apk add --no-cache \
  g++ \
  libc6-compat \
  make \
  python3 \
  && npm install --global pnpm@11.5.2

# The frontend depends on shared workspace libraries, so the Docker build
# context must be the repository root.
COPY . .

# Cache the pnpm store between Docker builds without copying node_modules into
# the final runtime image.
RUN --mount=type=cache,id=aerealith-pnpm-store,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile \
  && pnpm exec nx build frontend --skip-nx-cache

# ==============================================================================
# Runtime
# ==============================================================================

FROM nginx:1.28-alpine AS runtime

# Replace the stock Nginx site with an SPA-aware configuration.
RUN rm /etc/nginx/conf.d/default.conf

RUN <<'EOF'
cat > /etc/nginx/conf.d/default.conf <<'NGINX_CONF'
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Lightweight container and orchestration health check endpoint.
    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    # Vite generates hashed asset filenames. They can be safely cached for a
    # long time because each content change creates a new filename.
    location ~* \.(?:css|gif|ico|jpe?g|js|mjs|map|png|svg|webp|woff2?)$ {
        try_files $uri =404;

        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Always fetch the newest application entry point after a deployment.
    location = /index.html {
        add_header Cache-Control "no-store";
    }

    # React Router client-side routes must fall back to the Vite entry point.
    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINX_CONF
EOF

COPY --from=build /workspace/dist/apps/frontend /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
