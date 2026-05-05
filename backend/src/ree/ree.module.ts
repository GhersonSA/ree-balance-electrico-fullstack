import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReeClient } from './ree.client';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [ReeClient],
  exports: [ReeClient],
})
export class ReeModule {}
