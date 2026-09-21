FROM node:26.5.0-bookworm-slim AS node-runtime

FROM docker.io/cloudflare/sandbox:0.12.9

COPY --from=node-runtime /usr/local/ /usr/local/

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ripgrep ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --global pnpm@11.13.1

WORKDIR /workspace

EXPOSE 8080
