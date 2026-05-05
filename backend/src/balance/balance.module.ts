import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalanceController } from './balance.controller';
import { BalanceService } from './balance.service';
import { BalancePoint } from './entities/balance-point.entity';
import { ReeIngestLog } from './entities/ree-ingest-log.entity';
import { ReeModule } from '../ree/ree.module';

@Module({
  imports: [TypeOrmModule.forFeature([BalancePoint, ReeIngestLog]), ReeModule],
  controllers: [BalanceController],
  providers: [BalanceService],
  exports: [BalanceService],
})
export class BalanceModule {}
