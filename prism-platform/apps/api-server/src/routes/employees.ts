import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { cached, invalidate } from '../lib/cache.js';

export async function employeeRoutes(app: FastifyInstance) {
  /* ── List employees ── */
  app.get('/', async (request, _reply) => {
    const { companyId, storeId, regionId, active } = request.query as Record<string, string | undefined>;
    const cacheKey = `employees:list:${companyId || ''}:${storeId || ''}:${regionId || ''}:${active || ''}`;
    const data = await cached(cacheKey, () =>
      prisma.employee.findMany({
        where: {
          ...(companyId ? { companyId } : {}),
          ...(storeId ? { storeId } : {}),
          ...(regionId ? { store: { regionId } } : {}),
          ...(active !== undefined ? { isActive: active === 'true' } : { isActive: true }),
        },
        select: {
          id: true,
          empId: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          designation: true,
          storeId: true,
          isActive: true,
          dateOfJoining: true,
          category: true,
          location: true,
          store: {
            select: {
              id: true,
              storeName: true,
              storeCode: true,
              regionId: true,
              amId: true,
              amName: true,
              hrbp1Id: true,
              hrbp1Name: true,
              trainer1Id: true,
              trainer1Name: true,
              storeFormat: true,
              menuType: true,
              priceGroup: true,
              region: { select: { id: true, name: true } },
            },
          },
          role: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
    );
    return { data };
  });

  /* ── Get employee by ID ── */
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const employee = await cached(`employees:${id}`, () =>
      prisma.employee.findUnique({
        where: { id },
        include: {
          store: {
            include: {
              region: { select: { id: true, name: true } },
            },
          },
          role: { select: { id: true, name: true } },
        },
      }),
    );
    if (!employee) return reply.status(404).send({ error: 'Employee not found' });
    return { data: employee };
  });

  /* ── Create employee ── */
  app.post('/', async (request, reply) => {
    try {
      const body = request.body as {
        companyId: string;
        empId: string;
        name: string;
        email: string;
        phone?: string;
        department?: string;
        designation?: string;
        storeId?: string;
        roleId: string;
        dateOfJoining?: string;
        category?: string;
        location?: string;
        isActive?: boolean;
      };

      if (!body.companyId || !body.empId || !body.name || !body.email || !body.roleId) {
        return reply.status(400).send({ error: 'Missing required fields: companyId, empId, name, email, roleId' });
      }

      const employee = await prisma.employee.create({
        data: {
          companyId: body.companyId,
          empId: body.empId.toUpperCase(),
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          department: body.department || null,
          designation: body.designation || null,
          storeId: body.storeId || null,
          roleId: body.roleId,
          dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : null,
          category: body.category || null,
          location: body.location || null,
          isActive: body.isActive ?? true,
          passwordHash: '',
        },
        include: {
          store: { include: { region: { select: { id: true, name: true } } } },
          role: { select: { id: true, name: true } },
        },
      });

      // Invalidate employee list caches
      invalidate('employees:');
      return reply.status(201).send({ data: employee });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return reply.status(409).send({ error: 'Employee with this ID or email already exists' });
      }
      return reply.status(500).send({ error: err?.message || 'Failed to create employee' });
    }
  });

  /* ── Update employee ── */
  app.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as {
        name?: string;
        email?: string;
        phone?: string;
        department?: string;
        designation?: string;
        storeId?: string | null;
        roleId?: string;
        dateOfJoining?: string | null;
        category?: string;
        location?: string;
        isActive?: boolean;
        empId?: string;
      };

      const employee = await prisma.employee.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.email !== undefined ? { email: body.email } : {}),
          ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
          ...(body.department !== undefined ? { department: body.department || null } : {}),
          ...(body.designation !== undefined ? { designation: body.designation || null } : {}),
          ...(body.storeId !== undefined ? { storeId: body.storeId || null } : {}),
          ...(body.roleId !== undefined ? { roleId: body.roleId } : {}),
          ...(body.dateOfJoining !== undefined ? { dateOfJoining: body.dateOfJoining ? new Date(body.dateOfJoining) : null } : {}),
          ...(body.category !== undefined ? { category: body.category || null } : {}),
          ...(body.location !== undefined ? { location: body.location || null } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.empId !== undefined ? { empId: body.empId.toUpperCase() } : {}),
        },
        include: {
          store: { include: { region: { select: { id: true, name: true } } } },
          role: { select: { id: true, name: true } },
        },
      });

      // Invalidate caches
      invalidate('employees:');
      return { data: employee };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.status(404).send({ error: 'Employee not found' });
      }
      if (err?.code === 'P2002') {
        return reply.status(409).send({ error: 'Duplicate employee ID or email' });
      }
      return reply.status(500).send({ error: err?.message || 'Failed to update employee' });
    }
  });

  /* ── Delete employee (soft-delete) ── */
  app.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await prisma.employee.update({
        where: { id },
        data: { isActive: false },
      });
      invalidate('employees:');
      return { success: true };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.status(404).send({ error: 'Employee not found' });
      }
      return reply.status(500).send({ error: err?.message || 'Failed to delete employee' });
    }
  });
}
