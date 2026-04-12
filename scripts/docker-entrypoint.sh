#!/bin/sh
# =============================================================================
# Docker Entrypoint Script
# =============================================================================
# Starts both nginx and Node.js in the same container
# =============================================================================

set -e

echo "[Entrypoint] Starting Best Version application..."

# Ensure directories exist
mkdir -p /etc/nginx/ssl
mkdir -p /var/run/nginx
mkdir -p /var/log/nginx
touch /var/run/nginx.pid

# Generate nginx config based on SSL certificates
echo "[Entrypoint] Generating nginx configuration..."
/app/scripts/generate-nginx-config.sh

# Start nginx in background (foreground mode for Docker)
echo "[Entrypoint] Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for nginx to be ready
echo "[Entrypoint] Waiting for nginx to start..."
sleep 3

# Verify nginx started
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "[Entrypoint] ERROR: nginx failed to start"
    exit 1
fi
echo "[Entrypoint] nginx started (PID: $NGINX_PID)"

# Check if open-websearch MCP service is available (external container in docker-compose)
# The game-creator will use this for enhanced web search capabilities
if [ -n "$OPEN_WEBSEARCH_MCP_HOST" ]; then
    echo "[Entrypoint] Open WebSearch MCP configured: $OPEN_WEBSEARCH_MCP_HOST"

    # Wait for open-websearch to be ready (max 30 seconds)
    OPEN_WEBSEARCH_READY=false
    for i in 1 2 3 4 5 6; do
        if curl -sf --connect-timeout 5 "$OPEN_WEBSEARCH_MCP_HOST/health" > /dev/null 2>&1; then
            OPEN_WEBSEARCH_READY=true
            echo "[Entrypoint] Open WebSearch MCP service is ready"
            break
        fi
        echo "[Entrypoint] Waiting for Open WebSearch MCP... ($i/6)"
        sleep 5
    done

    if [ "$OPEN_WEBSEARCH_READY" = false ]; then
        echo "[Entrypoint] WARNING: Open WebSearch MCP service not responding"
        echo "[Entrypoint] Game-creator will operate with reduced search capabilities"
    fi
fi

# Start Node.js backend in background
echo "[Entrypoint] Starting Node.js application..."
node src/index.js &
NODE_PID=$!

# Verify Node.js started
if ! kill -0 $NODE_PID 2>/dev/null; then
    echo "[Entrypoint] ERROR: Node.js failed to start"
    kill $NGINX_PID
    exit 1
fi
echo "[Entrypoint] Node.js started (PID: $NODE_PID)"

# Set up signal handling for graceful shutdown
cleanup() {
    echo "[Entrypoint] Shut down requested, stopping services..."
    kill $NODE_PID 2>/dev/null || true
    kill $NGINX_PID 2>/dev/null || true
    wait
    echo "[Entrypoint] All services stopped"
}

trap cleanup SIGTERM SIGINT SIGQUIT

# Wait for both processes
echo "[Entrypoint] Waiting for processes..."
wait $NODE_PID $NGINX_PID
