import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { DateRangeQueryDto } from './dto/date-range-query.dto';

@Controller('api/v1/balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  getBalanceByRange(@Query() query: DateRangeQueryDto) {
    return this.balanceService.getByDateRange(query);
  }

  @Post('sync')
  sync(@Body() body: DateRangeQueryDto) {
    return this.balanceService.syncRange(body);
  }
}
