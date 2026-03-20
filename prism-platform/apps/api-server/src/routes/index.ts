import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.js';
import { programRoutes } from './programs.js';
import { submissionRoutes } from './submissions.js';
import { storeRoutes } from './stores.js';
import { employeeRoutes } from './employees.js';
import { taskRoutes } from './tasks.js';
import { analyticsRoutes } from './analytics.js';
import { notificationRoutes } from './notifications.js';
import { intelligenceRoutes } from './intelligence.js';
import { knowledgeRoutes } from './knowledge.js';
import { violationsRoutes } from './violations.js';
import { mapAnalyticsRoutes } from './map-analytics.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(programRoutes, { prefix: '/api/programs' });
  await app.register(submissionRoutes, { prefix: '/api/submissions' });
  await app.register(storeRoutes, { prefix: '/api/stores' });
  await app.register(employeeRoutes, { prefix: '/api/employees' });
  await app.register(taskRoutes, { prefix: '/api/tasks' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(intelligenceRoutes, { prefix: '/api/intelligence' });
  await app.register(knowledgeRoutes, { prefix: '/api/knowledge' });
  await app.register(violationsRoutes, { prefix: '/api/violations' });
  await app.register(mapAnalyticsRoutes, { prefix: '/api/map-analytics' });
}
