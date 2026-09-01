# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1
ARG NGINX_VERSION=1.30.4


# =============================================================================
# Base
# =============================================================================

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION

ENV CI=true \
  NODE_ENV=development \
  PNPM_CONFIG_IGNORE_SCRIPTS=true

WORKDIR /workspace

# Corepack is no longer bundled with Node.js 25+.
# Install the exact pnpm version directly and disable package lifecycle scripts
# during the package-manager installation itself.
RUN npm install \
  --global \
  --ignore-scripts \
  "pnpm@${PNPM_VERSION}" \
  && pnpm --version


# =============================================================================
# Dependencies
# =============================================================================

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  pnpm fetch \
  --frozen-lockfile \
  --store-dir=/pnpm/store


# =============================================================================
# Build
# =============================================================================

FROM dependencies AS build

COPY . .

# Do not implicitly execute lifecycle scripts from dependencies.
RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store,sharing=locked \
  pnpm install \
  --offline \
  --frozen-lockfile \
  --ignore-scripts \
  --store-dir=/pnpm/store \
  && PNPM_CONFIG_STORE_DIR=/pnpm/store pnpm exec nx build frontend --configuration=production \
  && test -f dist/apps/frontend/index.html


# =============================================================================
# Runtime
# =============================================================================

FROM nginx:${NGINX_VERSION}-alpine AS runtime

ARG APP_UID=10001
ARG APP_GID=10001

LABEL org.opencontainers.image.title="Aerealith Frontend" \
  org.opencontainers.image.description="Production container for the Aerealith web frontend" \
  org.opencontainers.image.vendor="SinLess Games LLC"


# =============================================================================
# Runtime user and Nginx configuration
# =============================================================================

# Keep all runtime initialization in a single image layer.
#
# Only Nginx temporary directories are writable by the application user.
# Configuration remains root-owned.
RUN <<'SETUP'
set -eu

apk add --no-cache \
  'libcrypto3>=3.5.8-r0' \
  'libexpat>=2.8.4-r0' \
  'libssl3>=3.5.8-r0'

addgroup \
  --system \
  --gid "${APP_GID}" \
  aerealith

adduser \
  --system \
  --disabled-password \
  --no-create-home \
  --uid "${APP_UID}" \
  --ingroup aerealith \
  aerealith

rm -f /etc/nginx/conf.d/default.conf

mkdir -p \
  /usr/share/nginx/html \
  /tmp/nginx/client_temp \
  /tmp/nginx/proxy_temp \
  /tmp/nginx/fastcgi_temp \
  /tmp/nginx/uwsgi_temp \
  /tmp/nginx/scgi_temp

chown -R aerealith:aerealith /tmp/nginx

cat > /etc/nginx/nginx.conf <<'NGINX_CONF'
worker_processes auto;
pid /tmp/nginx/nginx.pid;
error_log /dev/stderr warn;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';

  access_log /dev/stdout main;

  sendfile on;
  tcp_nopush on;
  keepalive_timeout 65;
  server_tokens off;

  client_body_temp_path /tmp/nginx/client_temp;
  proxy_temp_path /tmp/nginx/proxy_temp;
  fastcgi_temp_path /tmp/nginx/fastcgi_temp;
  uwsgi_temp_path /tmp/nginx/uwsgi_temp;
  scgi_temp_path /tmp/nginx/scgi_temp;

  gzip on;
  gzip_vary on;
  gzip_min_length 1024;

  gzip_types
    application/javascript
    application/json
    application/manifest+json
    application/xml
    image/svg+xml
    text/css
    text/plain
    text/xml;

  include /etc/nginx/conf.d/*.conf;
}
NGINX_CONF

cat > /etc/nginx/conf.d/frontend.conf <<'FRONTEND_CONF'
server {
  listen 8080;
  listen [::]:8080;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;

  location = /healthz {
    access_log off;
    default_type text/plain;
    return 200 "ok\n";
  }

  location /assets/ {
    try_files $uri =404;
    expires 1y;

    add_header Cache-Control "public, max-age=31536000, immutable" always;
    add_header X-Content-Type-Options "nosniff" always;
  }

  location = /index.html {
    expires -1;

    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
FRONTEND_CONF

chmod 0644 \
  /etc/nginx/nginx.conf \
  /etc/nginx/conf.d/frontend.conf
SETUP


# =============================================================================
# Application assets
# =============================================================================

# Static application content deliberately remains owned by root.
#
# The Nginx runtime account only needs read access and cannot alter the
# application being served.
COPY --from=build --chown=0:0 \
  /workspace/dist/apps/frontend/ \
  /usr/share/nginx/html/

RUN chmod -R u=rwX,go=rX /usr/share/nginx/html


# =============================================================================
# Runtime security
# =============================================================================

USER ${APP_UID}:${APP_GID}

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
