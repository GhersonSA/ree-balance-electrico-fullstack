import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface ReeFetchParams {
  startDate: string;
  endDate: string;
  timeTrunc: string;
}

@Injectable()
export class ReeClient {
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
    const response = await firstValueFrom(
      this.httpService.get(this.reeUrl, {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
          time_trunc: params.timeTrunc,
        },
        timeout: 15_000,
      }),
    );

    return response.data as Record<string, unknown>;
  }
}
