import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { Circle } from './dto/circle.dto';
import { CircleSchema } from './schemas/circle.schema';

@Module({
  imports: [TypegooseModule.forFeature([Circle])],
  controllers: [CirclesController],
  providers: [CirclesService],
})
export class CirclesModule {}
