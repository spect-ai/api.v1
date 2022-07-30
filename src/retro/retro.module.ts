import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { SlugService } from 'src/common/slug.service';
import { EventHandlers } from './events/handlers';
import { RequestProvider } from 'src/users/user.provider';
import { CommandHandlers } from './commands/handlers';
import { Retro } from './models/retro.model';
import { QueryHandlers } from './queries/handlers';
import { RetroController } from './retro.controller';
import { RetroRepository } from './retro.repository';
import { RetroService } from './retro.service';
import { CirclesModule } from 'src/circle/circles.module';
import { CircleAuthGuard } from 'src/auth/circle.guard';
import { RolesService } from 'src/roles/roles.service';
import { SessionAuthGuard } from 'src/auth/iron-session.guard';
import { DiscordService } from 'src/common/discord.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Retro]),
    CqrsModule,
    CirclesModule,
    EthAddressModule,
  ],
  controllers: [RetroController],
  providers: [
    RetroService,
    RetroRepository,
    SlugService,
    RequestProvider,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    CircleAuthGuard,
    RolesService,
    SessionAuthGuard,
    DiscordService,
    CommonTools,
    LoggingService,
  ],
  exports: [RetroService, RetroRepository, RetroModule],
})
export class RetroModule {}
