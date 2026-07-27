# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.5.0
ARG PNPM_VERSION=11.13.1
ARG NGINX_VERSION=1.29.0

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG PNPM_VERSION

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

WORKDIR /workspace

RUN corepack enable \
  && corepack prepare "pnpm@${PNPM_VERSION}" --activate

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store \
  pnpm fetch --frozen-lockfile

FROM dependencies AS build

COPY . .

RUN --mount=type=cache,id=aerealith-pnpm,target=/pnpm/store \
  pnpm install --offline --frozen-lockfile

RUN pnpm nx build frontend --configuration=production \
  && test -f dist/apps/frontend/index.html

FROM nginx:${NGINX_VERSION}-alpine AS runtime

LABEL org.opencontainers.image.title="Aerealith Frontend" \
  org.opencontainers.image.description="Production container for the Aerealith web frontend" \
  org.opencontainers.image.vendor="SinLess Games LLC"

RUN rm -f /etc/nginx/conf.d/default.conf \
  && mkdir -p \
  /tmp/nginx/client_temp \
  /tmp/nginx/proxy_temp \
  /tmp/nginx/fastcgi_temp \
  /tmp/nginx/uwsgi_temp \
  /tmp/nginx/scgi_temp

RUN cat <<'EOF' > /etc/nginx/nginx.conf
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
EOF

RUN cat <<'EOF' > /etc/nginx/conf.d/frontend.conf
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
EOF

COPY --from=build --chown=nginx:nginx \
  /workspace/dist/apps/frontend/ \
  /usr/share/nginx/html/

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
