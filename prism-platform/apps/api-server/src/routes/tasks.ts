import type { FastifyInstance } from 'fastify';

export async function taskRoutes(app: FastifyInstance) {
  app.get('/', async (_request, _reply) => {
    // TODO: List tasks
    return { data: [], message: 'Tasks list endpoint' };
  });

  app.get('/:id', async (_request, _reply) => {
    // TODO: Get task by ID
    return { message: 'Task detail endpoint' };
  });

  app.post('/', async (_request, _reply) => {
    // TODO: Create task
    return { message: 'Task create endpoint' };
  });

  app.patch('/:id/status', async (_request, _reply) => {
    // TODO: Update task status
    return { message: 'Task status update endpoint' };
  });
}
