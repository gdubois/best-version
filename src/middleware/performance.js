// Performance monitoring middleware
// Story 6.6: Performance Optimization

const { v4: uuidv4 } = require('uuid');

// Performance metrics storage
const metrics = {
  requests: [],
  avgResponseTime: 0,
  p50ResponseTime: 0,
  p95ResponseTime: 0,
  p99ResponseTime: 0,
  errors: [],
  cacheHits: 0,
  cacheMisses: 0
};

/**
 * Middleware to measure request performance
 * Records timing, status codes, and tracks cache hits
 */
function performanceMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId = uuidv4();

  // Attach request metadata
  req.requestId = requestId;
  req.startTime = startTime;

  // Track response for performance metrics
  const originalSend = res.send.bind(res);
  res.send = function(body) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Record metric
    recordMetric({
      requestId,
      method: req.method,
      path: req.path,
      duration,
      statusCode: res.statusCode,
      cacheHit: res.get('X-Cache') === 'HIT' || req.headers['x-cache-hit'] === 'HIT'
    });

    // Add performance headers
    res.set('X-Request-ID', requestId);
    res.set('X-Response-Time', `${duration}ms`);
    res.set('X-Timing-Start', startTime.toString());

    return originalSend(body);
  };

  // Track errors
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (res.statusCode >= 400) {
      recordError({
        requestId,
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        message: req.originalError || 'Unknown error'
      });
    }
  });

  next();
}

/**
 * Record a performance metric
 * @param {object} metric - Metric data
 */
function recordMetric(metric) {
  metrics.requests.push({
    ...metric,
    timestamp: new Date().toISOString()
  });

  // Keep only last 1000 requests in memory
  if (metrics.requests.length > 1000) {
    metrics.requests = metrics.requests.slice(-1000);
  }

  // Update cache statistics
  if (metric.cacheHit) {
    metrics.cacheHits++;
  } else {
    metrics.cacheMisses++;
  }

  // Recalculate statistics
  recalculateStats();
}

/**
 * Record an error metric
 * @param {object} error - Error data
 */
function recordError(error) {
  metrics.errors.push({
    ...error,
    timestamp: new Date().toISOString()
  });

  // Keep only last 100 errors
  if (metrics.errors.length > 100) {
    metrics.errors = metrics.errors.slice(-100);
  }
}

/**
 * Recalculate performance statistics
 */
function recalculateStats() {
  if (metrics.requests.length === 0) {
    return;
  }

  const durations = metrics.requests.map(r => r.duration).sort((a, b) => a - b);
  const total = durations.reduce((sum, d) => sum + d, 0);

  metrics.avgResponseTime = total / durations.length;
  metrics.p50ResponseTime = durations[Math.floor(durations.length * 0.5)] || 0;
  metrics.p95ResponseTime = durations[Math.floor(durations.length * 0.95)] || 0;
  metrics.p99ResponseTime = durations[Math.floor(durations.length * 0.99)] || 0;
}

/**
 * Get current performance metrics
 * @returns {object} - Performance metrics
 */
function getMetrics() {
  return {
    ...metrics,
    summary: {
      totalRequests: metrics.requests.length,
      totalErrors: metrics.errors.length,
      avgResponseTime: metrics.avgResponseTime,
      p50ResponseTime: metrics.p50ResponseTime,
      p95ResponseTime: metrics.p95ResponseTime,
      p99ResponseTime: metrics.p99ResponseTime,
      cacheHitRate: getCacheHitRate()
    }
  };
}

/**
 * Get cache hit rate
 * @returns {number} - Cache hit rate percentage
 */
function getCacheHitRate() {
  const total = metrics.cacheHits + metrics.cacheMisses;
  if (total === 0) return 0;
  return ((metrics.cacheHits / total) * 100).toFixed(2);
}

/**
 * Performance benchmark utility
 */
class PerformanceBenchmark {
  constructor() {
    this.benchmarks = [];
  }

  /**
   * Start a benchmark
   * @param {string} name - Benchmark name
   */
  start(name) {
    this.currentStart = Date.now();
    this.currentName = name;
    return this;
  }

  /**
   * End a benchmark and record result
   * @returns {number} - Duration in milliseconds
   */
  end() {
    if (!this.currentStart) {
      throw new Error('No benchmark started');
    }

    const duration = Date.now() - this.currentStart;
    this.benchmarks.push({
      name: this.currentName,
      duration,
      timestamp: new Date().toISOString()
    });

    this.currentStart = null;
    this.currentName = null;

    return duration;
  }

  /**
   * Get benchmark results
   * @returns {Array} - Benchmark results
   */
  getResults() {
    return this.benchmarks;
  }

  /**
   * Get average duration for a benchmark name
   * @param {string} name - Benchmark name
   * @returns {number} - Average duration
   */
  getAverage(name) {
    const matches = this.benchmarks.filter(b => b.name === name);
    if (matches.length === 0) return 0;

    const total = matches.reduce((sum, b) => sum + b.duration, 0);
    return total / matches.length;
  }
}

const benchmark = new PerformanceBenchmark();

module.exports = {
  performanceMiddleware,
  getMetrics,
  getCacheHitRate,
  PerformanceBenchmark,
  benchmark
};
