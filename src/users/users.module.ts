import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { EventHandlers } from './events/handlers';
import { CommonTools } from 'src/common/common.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { User } from './model/users.model';
import { RequestProvider } from './user.provider';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { QueryHandlers } from './queries/handlers';
import { UserFieldResolver } from './queries/handlers/get-user.handler';
import {
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { CommandHandlers } from './commands/handlers';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { LensService } from './external/lens.service';
import { UsersControllerV1 } from './users-v1.controller';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';

@Module({
  imports: [TypegooseModule.forFeature([User]), EthAddressModule, CqrsModule],
  controllers: [UsersController, UsersControllerV1],
  providers: [
    UsersService,
    UsersRepository,
    RequestProvider,
    CommonTools,
    ...EventHandlers,
    ...QueryHandlers,
    ...CommandHandlers,
    UserFieldResolver,
    PublicViewAuthGuard,
    SessionAuthGuard,
    LoggingService,
    MailService,
    LensService,
    RealtimeGateway,
  ],
  exports: [UsersService, UsersRepository, UsersModule],
})
export class UsersModule {}
