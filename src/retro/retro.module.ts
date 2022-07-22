import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CircleV1Module } from 'src/circle-v1/circle-v1.module';
import { SlugService } from 'src/common/slug.service';
import { RequestProvider } from 'src/users/user.provider';
import { CommandHandlers } from './commands/handlers';
import { Retro } from './models/retro.model';
import { QueryHandlers } from './queries/handlers';
import { RetroController } from './retro.controller';
import { RetroRepository } from './retro.repository';
import { RetroService } from './retro.service';

@Module({
  imports: [TypegooseModule.forFeature([Retro]), CqrsModule, CircleV1Module],
  controllers: [RetroController],
  providers: [
    RetroService,
    RetroRepository,
    SlugService,
    RequestProvider,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [RetroService, RetroRepository, RetroModule],
})
export class RetroModule {}
