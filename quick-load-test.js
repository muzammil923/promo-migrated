const http = require('http');

const BASE_URL = 'http://localhost:8080';
const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 10;
const DELAY_BETWEEN_REQUESTS = 50;

const ENDPOINTS = [
  { path: '/api/check-code', method: 'GET', name: 'Health Check' },
  { path: '/api/system/status', method: 'GET', name: 'System Status' },
  { path: '/api/games', method: 'GET', name: 'Games List' },
  { path: '/api/leaderboard', method: 'GET', name: 'Leaderboard' },
];

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const start = Date.now();
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: endpoint.path,
      method: endpoint.method,
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint: endpoint.name,
          statusCode: res.statusCode,
          duration: Date.now() - start,
          success: res.statusCode < 500,
          error: null
        });
      });
    });

    req.on('error', (error) => {
      resolve({ endpoint: endpoint.name, statusCode: 0, duration: Date.now() - start, success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ endpoint: endpoint.name, statusCode: 0, duration: 5000, success: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function runLoadTest() {
  console.log(`🚀 Quick Load Test: ${CONCURRENT_USERS} users × ${REQUESTS_PER_USER} requests`);
  console.log(`Endpoints: ${ENDPOINTS.map(e => e.name).join(', ')}\n`);

  const results = [];
  let completed = 0;
  const totalRequests = CONCURRENT_USERS * REQUESTS_PER_USER * ENDPOINTS.length;

  const startTime = Date.now();

  const workers = [];
  for (let user = 0; user < CONCURRENT_USERS; user++) {
    const worker = (async () => {
      for (let req = 0; req < REQUESTS_PER_USER; req++) {
        for (const endpoint of ENDPOINTS) {
          const result = await makeRequest(endpoint);
          results.push(result);
          completed++;
          if (completed % 50 === 0) {
            console.log(`Progress: ${completed}/${totalRequests} (${(completed/totalRequests*100).toFixed(1)}%)`);
          }
          if (DELAY_BETWEEN_REQUESTS > 0) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
          }
        }
      }
    })();
    workers.push(worker);
  }

  await Promise.all(workers);
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.filter(r => r.success).map(r => r.duration));

  const endpointStats = {};
  ENDPOINTS.forEach(e => endpointStats[e.name] = { success: 0, failed: 0, total: 0, durations: [] });
  results.forEach(r => {
    if (endpointStats[r.endpoint]) {
      endpointStats[r.endpoint].total++;
      if (r.success) {
        endpointStats[r.endpoint].success++;
        endpointStats[r.endpoint].durations.push(r.duration);
      } else {
        endpointStats[r.endpoint].failed++;
      }
    }
  });

  console.log('\n📊 LOAD TEST RESULTS');
  console.log('═'.repeat(50));
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successful} (${(successful/totalRequests*100).toFixed(2)}%)`);
  console.log(`Failed: ${failed} (${(failed/totalRequests*100).toFixed(2)}%)`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Throughput: ${(totalRequests/totalTime*1000).toFixed(2)} req/sec`);
  console.log(`Avg Response Time: ${avgDuration.toFixed(2)}ms`);
  console.log(`Min Response Time: ${minDuration}ms`);
  console.log(`Max Response Time: ${maxDuration}ms`);
  console.log('');

  console.log('📈 Per-Endpoint Stats:');
  Object.entries(endpointStats).forEach(([name, stats]) => {
    const avg = stats.durations.length > 0 ? stats.durations.reduce((a,b) => a+b, 0) / stats.durations.length : 0;
    console.log(`  ${name}:`);
    console.log(`    Success: ${stats.success}/${stats.total} (${(stats.success/stats.total*100).toFixed(1)}%)`);
    console.log(`    Avg Response: ${avg.toFixed(2)}ms`);
  });

  const errors = results.filter(r => !r.success);
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    const errorCounts = {};
    errors.forEach(e => {
      const key = `${e.endpoint}: ${e.error || `HTTP ${e.statusCode}`}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`  ${error}: ${count} occurrences`);
    });
  }

  const fs = require('fs');
  fs.writeFileSync('load-test-results.json', JSON.stringify({
    summary: {
      totalRequests,
      successful,
      failed,
      successRate: successful/totalRequests*100,
      totalTimeMs: totalTime,
      throughput: totalRequests/totalTime*1000,
      avgResponseTime: avgDuration,
      minResponseTime: minDuration,
      maxResponseTime: maxDuration
    },
    endpoints: Object.fromEntries(
      Object.entries(endpointStats).map(([name, stats]) => [
        name, {
          success: stats.success,
          failed: stats.failed,
          total: stats.total,
          successRate: stats.success/stats.total*100,
          avgResponseTime: stats.durations.length > 0 ? stats.durations.reduce((a,b)=>a+b,0)/stats.durations.length : 0
        }
      ])
    ),
    errors: errors.map(e => ({ endpoint: e.endpoint, error: e.error, statusCode: e.statusCode })),
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('\n📄 Results saved to load-test-results.json');
}

runLoadTest().catch(console.error);
