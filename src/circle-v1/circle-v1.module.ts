import { Module } from '@nestjs/common';
import { CircleV1Service } from './circle-v1.service';
import { CircleV1Controller } from './circle-v1.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { QueryHandlers } from './queries/handlers';
import { CirclesRepository } from './circle-v1.repository';
import { TypegooseModule } from 'nestjs-typegoose';
import { Circle } from './model/circle-v1.model';

export const CommandHandlers = [];
export const EventHandlers = [];

@Module({
  imports: [CqrsModule, TypegooseModule.forFeature([Circle])],
  controllers: [CircleV1Controller],
  providers: [
    CircleV1Service,
    CirclesRepository,
    ...CommandHandlers,
    ...EventHandlers,
    ...QueryHandlers,
  ],
})
export class CircleV1Module {}
