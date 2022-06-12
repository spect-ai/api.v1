import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { Circle } from './model/circle.model';
import { CirclesRepository } from './circles.repository';
import { SlugService } from 'src/common/slug.service';

@Module({
  imports: [TypegooseModule.forFeature([Circle])],
  controllers: [CirclesController],
  providers: [CirclesService, CirclesRepository, SlugService],
})
export class CirclesModule {}
