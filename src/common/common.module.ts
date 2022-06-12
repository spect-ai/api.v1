import { Module } from '@nestjs/common';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [SlugService],
})
export class CommonModule {}
