import type { FastifyInstance } from 'fastify';

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (_request, _reply) => {
    // TODO: Implement login
    return { message: 'Auth login endpoint' };
  });

  app.post('/logout', async (_request, _reply) => {
    // TODO: Implement logout
    return { message: 'Auth logout endpoint' };
  });

  app.get('/me', async (_request, _reply) => {
    // TODO: Implement get current user
    return { message: 'Auth me endpoint' };
  });
}
