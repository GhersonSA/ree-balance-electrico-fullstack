import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BalanceService, SyncResult } from './balance.service';
import { BalancePoint } from './entities/balance-point.entity';
import { ReeIngestLog } from './entities/ree-ingest-log.entity';
import { ReeClient, ReeApiUnavailableError } from '../ree/ree.client';

const mockBalanceRepo = () => ({
  upsert: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockIngestLogRepo = () => ({
  save: jest.fn(),
  findOne: jest.fn(),
});

const mockReeClient = () => ({
  fetchBalance: jest.fn(),
});

const VALID_QUERY = {
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-01-02T00:00:00.000Z',
  timeTrunc: 'day' as const,
};

const REE_PAYLOAD: Record<string, unknown> = {
  included: [
    {
      type: 'Renovable',
      attributes: {
        title: 'Energía Renovable',
        values: [
          {
            datetime: '2024-01-01T01:00:00.000Z',
            value: 1234.5,
            percentage: 45.2,
            unit: 'MW',
          },
          {
            datetime: '2024-01-01T02:00:00.000Z',
            value: 1300.0,
            percentage: 46.0,
            unit: 'MW',
          },
        ],
      },
    },
  ],
};

describe('BalanceService', () => {
  let service: BalanceService;
  let balanceRepo: ReturnType<typeof mockBalanceRepo>;
  let ingestLogRepo: ReturnType<typeof mockIngestLogRepo>;
  let reeClient: ReturnType<typeof mockReeClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceService,
        {
          provide: getRepositoryToken(BalancePoint),
          useFactory: mockBalanceRepo,
        },
        {
          provide: getRepositoryToken(ReeIngestLog),
          useFactory: mockIngestLogRepo,
        },
        { provide: ReeClient, useFactory: mockReeClient },
      ],
    }).compile();

    service = module.get(BalanceService);
    balanceRepo = module.get(getRepositoryToken(BalancePoint));
    ingestLogRepo = module.get(getRepositoryToken(ReeIngestLog));
    reeClient = module.get(ReeClient);
  });

  describe('syncRange', () => {
    it('should upsert parsed points and return inserted count on success', async () => {
      reeClient.fetchBalance.mockResolvedValue(REE_PAYLOAD);
      balanceRepo.upsert.mockResolvedValue(undefined);
      ingestLogRepo.save.mockResolvedValue(undefined);

      const result: SyncResult = await service.syncRange(VALID_QUERY);

      expect(result.inserted).toBe(2);
      expect(result.stale).toBe(false);
      expect(result.lastSyncAt).toBeInstanceOf(Date);
      expect(balanceRepo.upsert).toHaveBeenCalledTimes(1);
      expect(ingestLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success' }),
      );
    });

    it('should not call upsert when payload has no points', async () => {
      reeClient.fetchBalance.mockResolvedValue({ included: [] });
      ingestLogRepo.save.mockResolvedValue(undefined);

      const result = await service.syncRange(VALID_QUERY);

      expect(result.inserted).toBe(0);
      expect(balanceRepo.upsert).not.toHaveBeenCalled();
    });

    it('should parse points from nested attributes.content values', async () => {
      const nestedPayload = {
        included: [
          {
            type: 'Renovable',
            attributes: {
              title: 'Renovable',
              values: [],
              content: [
                {
                  type: 'Hidraulica',
                  attributes: {
                    title: 'Hidraulica',
                    values: [
                      {
                        datetime: '2024-01-01T00:00:00.000Z',
                        value: 100.5,
                        percentage: 0.5,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      };

      reeClient.fetchBalance.mockResolvedValue(nestedPayload);
      balanceRepo.upsert.mockResolvedValue(undefined);
      ingestLogRepo.save.mockResolvedValue(undefined);

      const result = await service.syncRange(VALID_QUERY);

      expect(result.inserted).toBe(1);
      expect(balanceRepo.upsert).toHaveBeenCalledTimes(1);
      expect(balanceRepo.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            indicatorType: 'Hidraulica',
            indicatorName: 'Hidraulica',
          }),
        ]),
        expect.any(Object),
      );
    });

    it('should return stale=true and lastSyncAt from last log when REE is unavailable', async () => {
      const lastSync = new Date('2024-01-01T00:00:00.000Z');
      reeClient.fetchBalance.mockRejectedValue(
        new ReeApiUnavailableError(new Error('ECONNREFUSED')),
      );
      ingestLogRepo.save.mockResolvedValue(undefined);
      ingestLogRepo.findOne.mockResolvedValue({ fetchedAt: lastSync });

      const result: SyncResult = await service.syncRange(VALID_QUERY);

      expect(result.stale).toBe(true);
      expect(result.inserted).toBe(0);
      expect(result.lastSyncAt).toEqual(lastSync);
      expect(ingestLogRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error' }),
      );
    });

    it('should return stale=true with null lastSyncAt when no previous successful log exists', async () => {
      reeClient.fetchBalance.mockRejectedValue(
        new ReeApiUnavailableError(new Error('timeout')),
      );
      ingestLogRepo.save.mockResolvedValue(undefined);
      ingestLogRepo.findOne.mockResolvedValue(null);

      const result: SyncResult = await service.syncRange(VALID_QUERY);

      expect(result.stale).toBe(true);
      expect(result.lastSyncAt).toBeNull();
    });

    it('should rethrow non-ReeApiUnavailableError errors', async () => {
      reeClient.fetchBalance.mockRejectedValue(
        new Error('unexpected DB error'),
      );
      ingestLogRepo.save.mockResolvedValue(undefined);

      await expect(service.syncRange(VALID_QUERY)).rejects.toThrow(
        'unexpected DB error',
      );
    });
  });

  describe('syncRange — input validation', () => {
    it('should throw BadRequestException when startDate is after endDate', async () => {
      await expect(
        service.syncRange({
          startDate: '2024-01-02T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          timeTrunc: 'day',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid date strings', async () => {
      await expect(
        service.syncRange({
          startDate: 'not-a-date',
          endDate: '2024-01-01T00:00:00.000Z',
          timeTrunc: 'day',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getByDateRange', () => {
    it('should query balance repo with the given date range', async () => {
      const mockPoints = [{ id: '1' }] as BalancePoint[];

      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPoints),
      };
      balanceRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getByDateRange(VALID_QUERY);

      expect(result).toEqual(mockPoints);
      expect(qb.getMany).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid dates', async () => {
      await expect(
        service.getByDateRange({
          startDate: 'bad',
          endDate: '2024-01-01T00:00:00.000Z',
          timeTrunc: 'day',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
