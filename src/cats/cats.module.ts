import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CatsController } from './cats.controller';
import { CatsRepository } from './cats.repository';
import { CatsService } from './cats.service';
import { Cat } from './model/cat.model';

@Module({
  imports: [TypegooseModule.forFeature([Cat])],
  controllers: [CatsController],
  providers: [CatsService, CatsRepository],
})
export class CatsModule {}
