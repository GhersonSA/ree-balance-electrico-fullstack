import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { BalanceModule } from './balance/balance.module';
import { BalancePoint } from './balance/entities/balance-point.entity';
import { ReeIngestLog } from './balance/entities/ree-ingest-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_DATABASE'),
        entities: [BalancePoint, ReeIngestLog],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    BalanceModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
