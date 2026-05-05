import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, retry, timer } from 'rxjs';

const RETRY_COUNT = 2;
const RETRY_DELAY_MS = 1_000;

export class ReeApiUnavailableError extends Error {
  constructor(cause?: unknown) {
    const message =
      cause instanceof Error ? cause.message : 'REE API unavailable';
    super(message);
    this.name = 'ReeApiUnavailableError';
    this.cause = cause;
  }
}

interface ReeFetchParams {
  startDate: string;
  endDate: string;
  timeTrunc: string;
}

@Injectable()
export class ReeClient {
  private readonly logger = new Logger(ReeClient.name);
  private readonly reeUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.reeUrl =
      this.configService.get<string>('REE_BALANCE_URL') ??
      'https://apidatos.ree.es/es/datos/balance/balance-electrico';
  }

  async fetchBalance(params: ReeFetchParams): Promise<Record<string, unknown>> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(this.reeUrl, {
            params: {
              start_date: params.startDate,
              end_date: params.endDate,
              time_trunc: params.timeTrunc,
            },
            timeout: 15_000,
          })
          .pipe(
            retry({
              count: RETRY_COUNT,
              delay: (error, attempt) => {
                this.logger.warn(
                  `REE API attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}. Retrying in ${RETRY_DELAY_MS}ms...`,
                );
                return timer(RETRY_DELAY_MS);
              },
            }),
          ),
      );

      return response.data as Record<string, unknown>;
    } catch (error) {
      throw new ReeApiUnavailableError(error);
    }
  }
}
