# =============================================================================
# Best Version - Production Dockerfile
# =============================================================================
# Multi-stage Dockerfile for the Best Version application
# =============================================================================

# ============================================
# Stage 1: Builder for Node.js Backend
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY src ./src
COPY games ./games
COPY submissions ./submissions
COPY newsletters ./newsletters
COPY public ./public
COPY scripts ./scripts

# Build frontend (Astro)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY frontend/astro.config.mjs ./frontend/
COPY frontend/tailwind.config.mjs ./frontend/
COPY frontend/package.json ./frontend/
COPY frontend/tsconfig.json ./frontend/

RUN cd frontend && npm run build

# ============================================
# Stage 2: Production Runtime
# ============================================
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install nginx for static file serving
RUN apk add --no-cache nginx openssl

# Create app directories
RUN mkdir -p /app/src /app/games /app/submissions /app/newsletters /app/public /app/scripts
RUN mkdir -p /var/log/nginx /var/run/nginx /var/www/certbot

# Create non-root users for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
# nginx user/group may already exist on alpine

# Copy built application from builder
COPY --from=builder /app/src /app/src
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/games /app/games
COPY --from=builder /app/submissions /app/submissions
COPY --from=builder /app/newsletters /app/newsletters
COPY --from=builder /app/public /app/public
COPY --from=builder /app/scripts /app/scripts
# Copy root level files
COPY game_metadata_schema.json ./

# Copy frontend build to nginx wwwroot
COPY --from=builder /app/frontend/dist /usr/share/nginx/html


# Copy nginx template config
COPY nginx/nginx-template.conf /etc/nginx/nginx-template.conf
# Copy nginx config generator script
COPY scripts/generate-nginx-config.sh /app/scripts/generate-nginx-config.sh

# Set proper ownership and permissions
RUN chown -R nginx:nginx /var/run/nginx /var/log/nginx /usr/share/nginx/html /var/www/certbot && \
    find /app/scripts -type f -name "*.sh" -exec chmod +x {} \; && \
    chown -R nodejs:nodejs /app && \
    chmod +x /app/scripts/generate-nginx-config.sh

# Expose ports
EXPOSE 3000 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

# Start nginx and Node.js
# Note: In docker-compose, we use a script to start both
CMD ["/bin/sh", "/app/scripts/docker-entrypoint.sh"]
