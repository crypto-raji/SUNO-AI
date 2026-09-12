# 1. Base image
FROM node:22-alpine AS base

# 2. Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/sona-ai

COPY package.json package-lock.json* ./
RUN npm ci

# 3. Builder stage
FROM base AS builder
WORKDIR /usr/src/sona-ai
COPY --from=deps /usr/src/sona-ai/node_modules ./node_modules
COPY . .

# Environment variables needed during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_SUPABASE_URL=https://znxoktfzeprragrgkmtj.supabase.co
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueG9rdGZ6ZXBycmFncmdrbXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNjY0ODIsImV4cCI6MjEwNDc0MjQ4Mn0.36UmvmvlrSBTsljPcHriJdpBM89A_ENz1-sFY3rvrgA

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# 4. Runner stage
FROM base AS runner
WORKDIR /usr/src/sona-ai

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
COPY --from=builder /usr/src/sona-ai/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /usr/src/sona-ai/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/sona-ai/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
