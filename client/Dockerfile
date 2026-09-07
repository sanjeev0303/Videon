FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS deps
WORKDIR /app

COPY client/package.json client/package-lock.json* ./client/
COPY sdk/videon-sdk/package.json sdk/videon-sdk/package-lock.json* ./sdk/videon-sdk/package.json
COPY sdk/videon-player/package.json sdk/videon-player/package-lock.json* ./sdk/videon-player/package.json

# npm ci would fail on file:../sdk/... deps without their sources beside client
COPY sdk ./sdk

RUN cd sdk/videon-sdk && npm ci --no-fund --no-audit && npm run build
RUN cd sdk/videon-player && npm ci --no-fund --no-audit && npm run build
RUN cd client && npm ci --no-fund --no-audit

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/client/node_modules ./client/node_modules
COPY --from=deps /app/sdk ./sdk
COPY client ./client

WORKDIR /app/client

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max_old_space_size=2048

ARG NEXT_PUBLIC_SERVER_URI=https://api.videon.motionmesh.co.in/api/v1
ENV NEXT_PUBLIC_SERVER_URI=$NEXT_PUBLIC_SERVER_URI

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/client/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]