import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { cached, invalidate } from '../lib/cache.js';
import { StoreIntelligenceService } from '../services/store-intelligence/index.js';

export async function storeRoutes(app: FastifyInstance) {
  /* ── List stores ── */
  app.get('/', async (request, _reply) => {
    const { companyId, regionId, active } = request.query as Record<string, string | undefined>;
    const cacheKey = `stores:list:${companyId || ''}:${regionId || ''}:${active || ''}`;
    const data = await cached(cacheKey, () =>
      prisma.store.findMany({
        where: {
          ...(companyId ? { companyId } : {}),
          ...(regionId ? { regionId } : {}),
          ...(active !== undefined ? { isActive: active === 'true' } : {}),
        },
        include: { region: { select: { id: true, name: true } } },
        orderBy: { storeName: 'asc' },
      }),
    );
    return { data };
  });

  /* ── Get store by ID ── */
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const store = await cached(`stores:${id}`, () =>
      prisma.store.findUnique({
        where: { id },
        include: {
          region: { select: { name: true } },
          employees: { where: { isActive: true }, orderBy: { name: 'asc' } },
        },
      }),
    );
    if (!store) return reply.status(404).send({ error: 'Store not found' });
    return { data: store };
  });

  /* ── Create store ── */
  app.post('/', async (request, reply) => {
    try {
      const body = request.body as {
        companyId: string;
        storeName: string;
        storeCode?: string;
        city: string;
        state?: string;
        address?: string;
        regionId?: string;
        amId?: string;
        amName?: string;
        hrbp1Id?: string;
        hrbp1Name?: string;
        hrbp2Id?: string;
        hrbp2Name?: string;
        hrbp3Id?: string;
        hrbp3Name?: string;
        trainer1Id?: string;
        trainer1Name?: string;
        trainer2Id?: string;
        trainer2Name?: string;
        trainer3Id?: string;
        trainer3Name?: string;
        regionalTrainerId?: string;
        regionalTrainerName?: string;
        regionalHrId?: string;
        regionalHrName?: string;
        hrHeadId?: string;
        hrHeadName?: string;
        storeFormat?: string;
        menuType?: string;
        priceGroup?: string;
        isActive?: boolean;
      };

      if (!body.companyId || !body.storeName || !body.city) {
        return reply.status(400).send({ error: 'Missing required fields: companyId, storeName, city' });
      }

      const store = await prisma.store.create({
        data: {
          companyId: body.companyId,
          storeName: body.storeName,
          storeCode: body.storeCode || null,
          city: body.city,
          state: body.state || null,
          address: body.address || null,
          regionId: body.regionId || null,
          amId: body.amId || null,
          amName: body.amName || null,
          hrbp1Id: body.hrbp1Id || null,
          hrbp1Name: body.hrbp1Name || null,
          hrbp2Id: body.hrbp2Id || null,
          hrbp2Name: body.hrbp2Name || null,
          hrbp3Id: body.hrbp3Id || null,
          hrbp3Name: body.hrbp3Name || null,
          trainer1Id: body.trainer1Id || null,
          trainer1Name: body.trainer1Name || null,
          trainer2Id: body.trainer2Id || null,
          trainer2Name: body.trainer2Name || null,
          trainer3Id: body.trainer3Id || null,
          trainer3Name: body.trainer3Name || null,
          regionalTrainerId: body.regionalTrainerId || null,
          regionalTrainerName: body.regionalTrainerName || null,
          regionalHrId: body.regionalHrId || null,
          regionalHrName: body.regionalHrName || null,
          hrHeadId: body.hrHeadId || null,
          hrHeadName: body.hrHeadName || null,
          storeFormat: body.storeFormat || null,
          menuType: body.menuType || null,
          priceGroup: body.priceGroup || null,
          isActive: body.isActive ?? true,
        },
        include: { region: { select: { id: true, name: true } } },
      });

      invalidate('stores:');
      return reply.status(201).send({ data: store });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return reply.status(409).send({ error: 'Store with this code already exists' });
      }
      return reply.status(500).send({ error: err?.message || 'Failed to create store' });
    }
  });

  /* ── Update store ── */
  app.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, any>;

      // Build update payload from all non-undefined fields
      const allowedFields = [
        'storeName', 'storeCode', 'city', 'state', 'address', 'regionId',
        'amId', 'amName', 'hrbp1Id', 'hrbp1Name', 'hrbp2Id', 'hrbp2Name',
        'hrbp3Id', 'hrbp3Name', 'trainer1Id', 'trainer1Name', 'trainer2Id',
        'trainer2Name', 'trainer3Id', 'trainer3Name', 'regionalTrainerId',
        'regionalTrainerName', 'regionalHrId', 'regionalHrName', 'hrHeadId',
        'hrHeadName', 'storeFormat', 'menuType', 'priceGroup', 'isActive',
      ];

      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field] === '' ? null : body[field];
        }
      }

      const store = await prisma.store.update({
        where: { id },
        data: updateData,
        include: { region: { select: { id: true, name: true } } },
      });

      invalidate('stores:');
      return { data: store };
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.status(404).send({ error: 'Store not found' });
      }
      if (err?.code === 'P2002') {
        return reply.status(409).send({ error: 'Duplicate store code' });
      }
      return reply.status(500).send({ error: err?.message || 'Failed to update store' });
    }
  });

  /* ── Store Intelligence (analytics payload) ── */
  app.get('/:id/intelligence', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { range } = request.query as { range?: string };
    const validRanges = ['30d', '90d', '6m', '1y'] as const;
    const timeRange = validRanges.includes(range as any) ? (range as '30d' | '90d' | '6m' | '1y') : '90d';

    const data = await StoreIntelligenceService.getIntelligence(id, timeRange);
    if (!data) return reply.status(404).send({ error: 'Store not found' });
    return { data };
  });
}
