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

# Install nginx for static file serving
RUN apk add --no-cache nginx openssl

# Create app directories
RUN mkdir -p /app/src /app/games /app/submissions /app/newsletters /app/public
RUN mkdir -p /var/log/nginx /var/run/nginx

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/games ./games
COPY --from=builder /app/submissions ./submissions
COPY --from=builder /app/newsletters ./newsletters
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Copy frontend build to nginx wwwroot
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Create directory for Let's Encrypt challenges
RUN mkdir -p /var/www/certbot

# Copy nginx configuration (from build context root)
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Set proper ownership and permissions
RUN chown -R nginx:nginx /var/run/nginx /var/log/nginx /usr/share/nginx/html && \
    chmod +x /app/scripts/*.sh

# Expose ports
EXPOSE 3000 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

# Start nginx and Node.js
# Note: In docker-compose, we use a script to start both
CMD ["/app/scripts/docker-entrypoint.sh"]
