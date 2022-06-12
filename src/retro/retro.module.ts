import { Module } from '@nestjs/common';
import { RetroController } from './retro.controller';

@Module({
  controllers: [RetroController]
})
export class RetroModule {}
