import type { FastifyInstance } from 'fastify';

export async function notificationRoutes(app: FastifyInstance) {
  app.get('/', async (_request, _reply) => {
    // TODO: List notifications for user
    return { data: [], message: 'Notifications list endpoint' };
  });

  app.patch('/:id/read', async (_request, _reply) => {
    // TODO: Mark notification as read
    return { message: 'Notification read endpoint' };
  });
}
