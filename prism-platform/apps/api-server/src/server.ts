import { buildApp } from './app.js';
import { config } from './config/index.js';

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    console.warn(`Prism API Server running on ${config.host}:${config.port}`);

    // ── Pre-warm cache: fire common queries in background ──
    warmCache(config.port).catch(() => {});
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

/** Hit the most-visited endpoints once so the cache is hot before the first user request */
async function warmCache(port: number) {
  const base = `http://127.0.0.1:${port}`;
  const endpoints = [
    '/api/stores?companyId=00000000-0000-0000-0000-000000000001',
    '/api/employees?companyId=00000000-0000-0000-0000-000000000001',
    '/api/programs?companyId=00000000-0000-0000-0000-000000000001&limit=100',
    '/api/analytics/filters',
    '/api/analytics/dashboard/operations',
    '/api/analytics/dashboard/hr',
    '/api/analytics/dashboard/training',
    '/api/analytics/dashboard/shlp',
    '/api/analytics/dashboard/campus-hiring',
    '/api/analytics/consolidated',
  ];
  const t0 = Date.now();
  await Promise.allSettled(endpoints.map(ep => fetch(`${base}${ep}`)));
  console.warn(`Cache warm-up complete in ${Date.now() - t0}ms (${endpoints.length} endpoints)`);
}

start();
