# syntax=docker/dockerfile:1.7

# Build from the repository root:
#
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
ENV HOME=/home/node
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install only the native compilation tooling needed for workspace dependencies.
# The final runtime image does not contain these tools.
RUN apk add --no-cache \
    g++ \
    libc6-compat \
    make \
    python3 \
    && npm install --global pnpm@11.5.2

# The frontend depends on the Nx workspace and shared libraries, so Docker must
# build from the repository root context.
COPY --chown=node:node . .

# Give the unprivileged build user ownership of the pnpm home and workspace.
RUN mkdir -p /pnpm/store \
    && chown -R node:node /pnpm /workspace

# Build as the non-root Node image user. This prevents lifecycle scripts and
# build tooling from running as root inside the image build stage.
USER node

RUN --mount=type=cache,id=aerealith-pnpm-store,target=/pnpm/store,uid=1000,gid=1000 \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --frozen-lockfile \
    && pnpm exec nx build frontend --skip-nx-cache

# ==============================================================================
# Runtime
# ==============================================================================

# NGINX's maintained unprivileged image:
# - Runs NGINX as a non-root user.
# - Uses port 8080 by default.
# - Uses /tmp for the PID and temporary request files.
#
# Keep this version current through Dependabot's Docker updates.
FROM nginxinc/nginx-unprivileged:1.31.2-alpine3.23 AS runtime

# We temporarily become root only to replace the stock virtual-host
# configuration. The final container process always runs as nginx.
USER root

RUN rm -f /etc/nginx/conf.d/default.conf \
    && cat > /etc/nginx/conf.d/default.conf <<'NGINX_CONF'
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Do not reveal the NGINX version in HTTP responses.
    server_tokens off;

    # Lightweight container and orchestration health endpoint.
    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    # Vite assets use content-hashed names and may be safely cached long-term.
    location ~* \.(?:css|gif|ico|jpe?g|js|mjs|map|png|svg|webp|woff2?)$ {
        try_files $uri =404;

        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Always retrieve a current HTML entry point after deployment.
    location = /index.html {
        add_header Cache-Control "no-store";
    }

    # React Router needs SPA fallback for client-side routes.
    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
NGINX_CONF

# Copy only the built frontend into the runtime image.
# Ownership is explicitly assigned to the non-root NGINX user.
COPY --chown=nginx:nginx --from=build \
    /workspace/dist/apps/frontend \
    /usr/share/nginx/html

# The final process must never run as root.
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
