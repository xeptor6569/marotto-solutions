# Debian (glibc) rather than Alpine (musl): Next.js' TypeScript build worker
# segfaults under musl as the type program grows, and Prisma/sharp need the
# libc6-compat shim there. The slim image is ~120MB larger and boringly reliable.
FROM node:26-slim AS base
# OpenSSL for Prisma's query engine, CA certificates for outbound TLS (SMTP,
# Stripe, WebDAV). Both are present by default on Alpine but not on slim.
RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
# Maintenance scripts for the compose `migrate` service (e.g. seed-admin.js).
COPY scripts ./scripts/

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# next.config.ts decides at build time whether to emit browser source maps, so
# the dev/prod distinction has to be known here and not only at runtime.
ARG APP_ENV=production
ENV APP_ENV=$APP_ENV

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Which commit this image was built from, surfaced by /api/health so you can
# tell which branch a running dev instance is actually serving.
ARG APP_COMMIT_SHA=""
ENV APP_COMMIT_SHA=$APP_COMMIT_SHA

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home /app --shell /usr/sbin/nologin nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create data directory (and persistent config subdir) with correct permissions
RUN mkdir -p data/config && chown -R nextjs:nodejs data

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
