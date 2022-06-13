import { Module } from '@nestjs/common';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [SlugService],
  exports: [SlugService],
})
export class CommonModule {}
