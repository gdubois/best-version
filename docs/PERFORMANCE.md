# Performance Optimization Guide

## Story 6.6: Performance Optimization

This document describes the performance optimizations implemented for the Best Version platform.

## Requirements

- Page loads complete in < 2 seconds (NFR-P1)
- Search results return in < 30 seconds (NFR-P2)
- Handle 100 concurrent users without degradation (NFR-P3)
- Static assets cached by CDN (NFR-P4)
- Image optimization for fast loading
- Single operator can manage content updates without automation (NFR-Sc3)

## Caching Layer

### In-Memory Cache

Uses `lru-cache` for efficient in-memory caching with automatic eviction.

**Configuration:**
```javascript
const memoryCache = new CacheService({
  ttl: 300,           // 5 minutes default TTL
  max: 1000           // Maximum entries
});
```

**Features:**
- Automatic key-based caching for game data and search results
- Size-based eviction using LRU algorithm
- TTL-based expiration
- Hit/miss statistics tracking

### Redis Cache (Optional)

For distributed caching across multiple instances.

**Configuration:**
```javascript
const redisCache = new RedisCacheService({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});
```

**Environment Variables:**
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
ENABLE_REDIS_CACHE=true
```

### Data Cache Wrapper

`DataCache` class provides a unified interface for caching game data and search results.

**Cached Data:**
- Game details by slug
- Search results
- All games list

## Static Asset Caching

### Cache Control Headers

Static assets are served with appropriate cache control headers based on content type:

| Content Type | Cache Duration | Revalidation |
|-------------|----------------|--------------|
| Images | 7 days | No |
| CSS/JS | 7 days | No |
| Fonts | 7 days | No |
| JSON API | 5 minutes | Yes |
| HTML | No cache | Yes |

### ETag Support

Conditional requests are supported via ETag headers:
- `If-None-Match`: Returns 304 Not Modified if content unchanged
- `If-Modified-Since`: Returns 304 Not Modified if content unchanged

### CDN Headers

```
Vary: Accept-Encoding  # For CDNs handling compression
X-Cache-Hit: HIT/MISS  # Set by CDN
```

## Image Optimization

### Services

ImageService provides:
- **Format conversion**: JPEG/PNG → WebP/AVIF
- **Quality optimization**: Configurable quality setting (default: 80%)
- **Thumbnail generation**: Small (150x200), Medium (300x400), Large (600x800)
- **Lazy loading**: Placeholders for progressive loading

### Tools

Supports multiple image processing backends:
1. **Sharp** (Node.js library) - Recommended
2. **ImageMagick** - System tool
3. **GraphicsMagick** - System tool

**Installation:**
```bash
# Using Sharp (recommended)
npm install sharp

# Using ImageMagick
# Ubuntu/Debian: apt-get install imagemagick
# macOS: brew install imagemagick

# Using GraphicsMagick
# Ubuntu/Debian: apt-get install graphicsmagick
# macOS: brew install graphicsmagick
```

### Lazy Loading

Images use native lazy loading:
```html
<img src="placeholder.jpg" data-src="image.jpg" alt="Game" loading="lazy">
```

## Concurrency Handling

### Connection Tracking

- Tracks active connections per client
- Maximum concurrent users: 100 (configurable)
- Automatic cleanup of stale connections (5 minute timeout)

**Environment Variables:**
```
MAX_CONCURRENT_USERS=100
CONNECTION_TIMEOUT=300000  # 5 minutes
```

### Rate Limiting

Per-IP rate limiting to prevent abuse:

**Configuration:**
```
RATE_LIMIT_REQUESTS=1000   # Requests per window
RATE_LIMIT_WINDOW=60000    # 1 minute window
```

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Window: 60 seconds
```

## Performance Monitoring

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check with performance metrics |
| `/api/performance/metrics` | Detailed request metrics |
| `/api/performance/cache-stats` | Cache statistics |

### Metrics Tracked

- Request duration (average, P50, P95, P99)
- Cache hit rate
- Active connection count
- Error rates

### Response Headers

```
X-Request-ID: <unique-id>
X-Response-Time: <duration>ms
X-Active-Connections: <count>
X-Max-Connections: 100
```

## Running Benchmarks

### CLI Benchmark Tool

```bash
node scripts/benchmark.js
```

**Environment Variables:**
```bash
BENCHMARK_URL=http://localhost:3000
BENCHMARK_CONCURRENT=100      # Number of concurrent users
BENCHMARK_REQUESTS=100        # Requests per user
BENCHMARK_TIMEOUT=30000       # Timeout in milliseconds
```

**Example:**
```bash
BENCHMARK_CONCURRENT=100 node scripts/benchmark.js
```

### Expected Output

```
=== Performance Benchmark ===
Base URL: http://localhost:3000
Concurrent Users: 100
Requests per User: 100
Starting benchmark...

=== Benchmark Results ===

OVERALL STATISTICS
Total Requests: 10000
Successful: 9995 (99.95%)
Failed: 5 (0.05%)
Total Duration: 15000ms
Requests/Second: 666.67

RESPONSE TIMES
Min: 12ms
Max: 850ms
Average: 45.23ms
P50: 35ms
P95: 120ms
P99: 250ms

PERFORMANCE TARGETS
✓ PASS Page load < 2 seconds (actual: 45.23ms)
✓ PASS Search < 30 seconds (actual: 120ms)
✓ PASS 100 concurrent users (actual: 100 users)
✓ PASS Success rate > 99% (actual: 99.95%)
```

## Environment Configuration

### Required Variables

```bash
# Cache Settings
CACHE_TTL=300
CACHE_MAX=1000
ENABLE_MEMORY_CACHE=true
ENABLE_REDIS_CACHE=false

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Image Optimization
IMAGE_QUALITY=80

# Concurrency
MAX_CONCURRENT_USERS=100
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=60000
```

## Performance Checklist

- [x] In-memory caching for game data
- [x] Redis cache support for distributed caching
- [x] Static asset caching with appropriate headers
- [x] Image optimization (WebP/AVIF conversion)
- [x] Concurrency handling (100 concurrent users)
- [x] Rate limiting per IP
- [x] Performance monitoring endpoints
- [x] Benchmark utility
- [x] Connection timeout cleanup

## Troubleshooting

### Cache Not Working

1. Check cache configuration:
   ```bash
   curl http://localhost:3000/api/performance/cache-stats
   ```

2. Verify TTL is set correctly
3. Check for cache key collisions

### Slow Page Loads

1. Check response times:
   ```bash
   curl -I http://localhost:3000/
   ```

2. Look at performance metrics:
   ```bash
   curl http://localhost:3000/api/performance/metrics
   ```

3. Verify image optimization tools are installed:
   ```bash
   node -e "require('./src/services/imageService').ImageService"
   ```

### Too Many Concurrent Users

1. Increase `MAX_CONCURRENT_USERS`
2. Check for connection leaks
3. Verify timeout settings

## Best Practices

1. **Always use cache headers** for static assets
2. **Implement lazy loading** for images
3. **Monitor cache hit rates** regularly
4. **Set appropriate TTLs** based on data volatility
5. **Use CDN** for production deployments
6. **Enable Gzip/Brotli** compression
7. **Minimize CSS/JS** bundle sizes
8. **Use HTTP/2** for multiplexing
