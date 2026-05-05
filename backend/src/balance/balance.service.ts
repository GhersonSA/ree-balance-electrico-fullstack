import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { BalancePoint } from './entities/balance-point.entity';
import { ReeIngestLog } from './entities/ree-ingest-log.entity';
import { ReeClient, ReeApiUnavailableError } from '../ree/ree.client';

interface ParsedPoint {
  timestamp: Date;
  indicatorType: string;
  indicatorName: string;
  value: string;
  percentage: string | null;
  unit: string | null;
  timeTrunc: string;
  source: string;
}

export interface SyncResult {
  inserted: number;
  stale: boolean;
  lastSyncAt: Date | null;
}

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    @InjectRepository(BalancePoint)
    private readonly balanceRepo: Repository<BalancePoint>,
    @InjectRepository(ReeIngestLog)
    private readonly ingestLogRepo: Repository<ReeIngestLog>,
    private readonly reeClient: ReeClient,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledSync(): Promise<void> {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    await this.syncRange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      timeTrunc: 'day',
    });
  }

  async syncRange(query: DateRangeQueryDto): Promise<SyncResult> {
    this.assertDateRange(query.startDate, query.endDate);

    const timeTrunc = query.timeTrunc ?? 'day';

    try {
      const payload = await this.reeClient.fetchBalance({
        startDate: query.startDate,
        endDate: query.endDate,
        timeTrunc,
      });

      const points = this.parseBalancePayload(payload, timeTrunc);

      if (points.length > 0) {
        await this.balanceRepo.upsert(points, {
          conflictPaths: ['timestamp', 'indicatorType', 'timeTrunc'],
          skipUpdateIfNoValuesChanged: true,
        });
      }

      await this.ingestLogRepo.save({
        requestStart: new Date(query.startDate),
        requestEnd: new Date(query.endDate),
        timeTrunc,
        status: 'success',
        payload,
      });

      return { inserted: points.length, stale: false, lastSyncAt: new Date() };
    } catch (error) {
      const isReeDown = error instanceof ReeApiUnavailableError;
      const message = error instanceof Error ? error.message : 'Unknown error';

      await this.ingestLogRepo.save({
        requestStart: new Date(query.startDate),
        requestEnd: new Date(query.endDate),
        timeTrunc,
        status: 'error',
        errorMessage: message,
      });

      this.logger.error(
        `REE sync failed for ${query.startDate} - ${query.endDate}: ${message}`,
      );

      if (isReeDown) {
        const lastSuccessLog = await this.ingestLogRepo.findOne({
          where: { status: 'success' },
          order: { fetchedAt: 'DESC' },
        });

        return {
          inserted: 0,
          stale: true,
          lastSyncAt: lastSuccessLog?.fetchedAt ?? null,
        };
      }

      throw error;
    }
  }

  async getByDateRange(query: DateRangeQueryDto): Promise<BalancePoint[]> {
    this.assertDateRange(query.startDate, query.endDate);

    const qb = this.balanceRepo
      .createQueryBuilder('balance')
      .where('balance.timestamp >= :startDate', { startDate: query.startDate })
      .andWhere('balance.timestamp <= :endDate', { endDate: query.endDate })
      .andWhere('balance.timeTrunc = :timeTrunc', {
        timeTrunc: query.timeTrunc ?? 'day',
      })
      .orderBy('balance.timestamp', 'ASC');

    if (query.indicatorType) {
      qb.andWhere('balance.indicatorType = :indicatorType', {
        indicatorType: query.indicatorType,
      });
    }

    return qb.getMany();
  }

  private assertDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException(
        'startDate and endDate must be valid ISO dates.',
      );
    }

    if (start > end) {
      throw new BadRequestException('startDate must be before endDate.');
    }
  }

  private parseBalancePayload(
    payload: Record<string, unknown>,
    timeTrunc: string,
  ): ParsedPoint[] {
    const included = (payload.included as Array<Record<string, unknown>>) ?? [];

    return included.flatMap((item) => {
      const parentType = String(item.type ?? 'unknown');
      const attributes = (item.attributes as Record<string, unknown>) ?? {};
      const parentTitle = String(attributes.title ?? parentType);
      const parentValues =
        (attributes.values as Array<Record<string, unknown>>) ?? [];
      const content =
        (attributes.content as Array<Record<string, unknown>>) ?? [];

      const sourceNodes: Array<{
        type: string;
        title: string;
        values: Array<Record<string, unknown>>;
      }> = [
        { type: parentType, title: parentTitle, values: parentValues },
        ...content.map((child) => {
          const childType = String(child.type ?? parentType);
          const childAttributes =
            (child.attributes as Record<string, unknown>) ?? {};
          return {
            type: childType,
            title: String(childAttributes.title ?? childType),
            values:
              (childAttributes.values as Array<Record<string, unknown>>) ?? [],
          };
        }),
      ];

      return sourceNodes.flatMap((node) =>
        node.values
          .map((valueItem) => {
            const datetime = valueItem.datetime
              ? new Date(String(valueItem.datetime))
              : null;
            const value = valueItem.value;

            if (!datetime || Number.isNaN(datetime.getTime()) || value == null) {
              return null;
            }

            return {
              timestamp: datetime,
              indicatorType: node.type,
              indicatorName: node.title,
              value: String(value),
              percentage:
                valueItem.percentage != null
                  ? String(valueItem.percentage)
                  : null,
              unit: valueItem.unit ? String(valueItem.unit) : null,
              timeTrunc,
              source: 'ree',
            };
          })
          .filter((parsedItem): parsedItem is ParsedPoint => parsedItem !== null),
      );
    });
  }
}
