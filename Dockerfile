# =============================================================================
# research-mind-ui -- Multi-stage Dockerfile
# =============================================================================
# Build:  docker build -t research-mind-ui .
# Run:    docker run -p 15000:15000 research-mind-ui

# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Build arguments for environment configuration
ARG VITE_API_BASE_URL=http://localhost:15010
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------- Stage 2: Runtime ----------
FROM node:20-alpine AS runtime

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/build ./build

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 15000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:15000 || exit 1

# SvelteKit Node adapter runs on PORT
ENV PORT=15000
ENV HOST=0.0.0.0

CMD ["node", "build"]
