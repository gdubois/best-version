#!/usr/bin/env node
// Performance benchmark utility
// Story 6.6: Performance Optimization

const http = require('http');

const config = {
  baseUrl: process.env.BENCHMARK_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.BENCHMARK_CONCURRENT) || 10,
  requestsPerUser: parseInt(process.env.BENCHMARK_REQUESTS) || 100,
  timeout: parseInt(process.env.BENCHMARK_TIMEOUT) || 30000
};

class BenchmarkRunner {
  constructor() {
    this.results = {
      total: 0,
      successful: 0,
      failed: 0,
      durations: [],
      errors: []
    };
  }

  /**
   * Make a single HTTP request
   */
  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const req = http.request({
        hostname: new URL(config.baseUrl).hostname,
        port: new URL(config.baseUrl).port,
        path,
        method: 'GET',
        timeout: config.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Performance-Benchmark/1.0'
        }
      }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const duration = Date.now() - startTime;
          const success = res.statusCode === 200;

          resolve({
            success,
            statusCode: res.statusCode,
            duration,
            path
          });
        });
      });

      req.on('error', (error) => {
        const duration = Date.now() - startTime;
        reject({
          error: error.message,
          duration,
          path
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          error: 'Request timeout',
          duration: config.timeout,
          path
        });
      });

      req.end();
    });
  }

  /**
   * Run a single user's requests
   */
  async runUser(userId) {
    const userResults = {
      userId,
      requests: []
    };

    // Define endpoints to test
    const endpoints = [
      '/',
      '/search',
      '/health',
      '/api/games'
    ];

    for (let i = 0; i < config.requestsPerUser; i++) {
      const endpoint = endpoints[i % endpoints.length];

      try {
        const result = await this.makeRequest(endpoint);
        userResults.requests.push(result);

        if (result.success) {
          this.results.successful++;
          this.results.durations.push(result.duration);
        } else {
          this.results.failed++;
          this.results.errors.push({
            userId,
            request: i,
            path: endpoint,
            statusCode: result.statusCode,
            duration: result.duration
          });
        }
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({
          userId,
          request: i,
          path: endpoint,
          error: error.error
        });
      }

      this.results.total++;

      // Small delay between requests to simulate realistic usage
      if (i < config.requestsPerUser - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return userResults;
  }

  /**
   * Run concurrent benchmark
   */
  async runConcurrent() {
    console.log('=== Performance Benchmark ===');
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Concurrent Users: ${config.concurrentUsers}`);
    console.log(`Requests per User: ${config.requestsPerUser}`);
    console.log('Starting benchmark...\n');

    const startTime = Date.now();

    // Run all users concurrently
    const userPromises = [];
    for (let i = 0; i < config.concurrentUsers; i++) {
      userPromises.push(this.runUser(i));
    }

    await Promise.all(userPromises);

    const totalDuration = Date.now() - startTime;

    this.printResults(totalDuration);
  }

  /**
   * Print benchmark results
   */
  printResults(totalDuration) {
    console.log('\n=== Benchmark Results ===\n');

    // Overall statistics
    console.log('OVERALL STATISTICS');
    console.log('------------------');
    console.log(`Total Requests: ${this.results.total}`);
    console.log(`Successful: ${this.results.successful} (${((this.results.successful / this.results.total) * 100).toFixed(2)}%)`);
    console.log(`Failed: ${this.results.failed} (${((this.results.failed / this.results.total) * 100).toFixed(2)}%)`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Requests/Second: ${(this.results.total / (totalDuration / 1000)).toFixed(2)}`);

    // Response time statistics
    console.log('\nRESPONSE TIMES');
    console.log('--------------');

    if (this.results.durations.length > 0) {
      const sorted = [...this.results.durations].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;

      // Percentiles
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      console.log(`Min: ${min}ms`);
      console.log(`Max: ${max}ms`);
      console.log(`Average: ${avg.toFixed(2)}ms`);
      console.log(`P50: ${p50}ms`);
      console.log(`P95: ${p95}ms`);
      console.log(`P99: ${p99}ms`);
    }

    // Error summary
    if (this.results.errors.length > 0) {
      console.log('\nERRORS');
      console.log('------');
      const errorsByType = {};
      this.results.errors.forEach(e => {
        const key = e.error || `HTTP ${e.statusCode}`;
        errorsByType[key] = (errorsByType[key] || 0) + 1;
      });

      Object.entries(errorsByType).forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
    }

    // Performance targets
    console.log('\nPERFORMANCE TARGETS');
    console.log('-------------------');

    const targets = [
      { name: 'Page load < 2 seconds', actual: avg, threshold: 2000, pass: avg < 2000 },
      { name: 'Search < 30 seconds', actual: p95, threshold: 30000, pass: p95 < 30000 },
      { name: '100 concurrent users', actual: this.results.total, threshold: config.concurrentUsers, pass: this.results.total >= config.concurrentUsers },
      { name: 'Success rate > 99%', actual: (this.results.successful / this.results.total) * 100, threshold: 99, pass: (this.results.successful / this.results.total) * 100 >= 99 }
    ];

    targets.forEach(target => {
      const status = target.pass ? '✓ PASS' : '✗ FAIL';
      const actualStr = target.threshold === config.concurrentUsers || target.threshold === config.requestsPerUser
        ? `${Math.round(target.actual)} users/requests`
        : `${target.actual}ms / ${target.actual}%`;

      console.log(`${status} ${target.name} (actual: ${actualStr})`);
    });

    console.log('\nBenchmark complete!');
  }
}

// Run benchmark
const runner = new BenchmarkRunner();
runner.runConcurrent().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
