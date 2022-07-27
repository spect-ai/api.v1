import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CardsModule } from 'src/card/cards.module';
import { EventHandlers } from './events/handlers';
import { CommonTools } from 'src/common/common.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { User } from './model/users.model';
import { RequestProvider } from './user.provider';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { CardNotificationService } from './notification/card-notification.service';
import { QueryHandlers } from './queries/handlers';
import { UserFieldResolver } from './queries/handlers/get-user.handler';
import { RetroNotificationService } from './notification/retro-notification.service';

@Module({
  imports: [
    TypegooseModule.forFeature([User]),
    EthAddressModule,
    forwardRef(() => CardsModule),
    CqrsModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    RequestProvider,
    CommonTools,
    CardNotificationService,
    RetroNotificationService,
    ...EventHandlers,
    ...QueryHandlers,
    UserFieldResolver,
  ],
  exports: [UsersService, UsersRepository, UsersModule],
})
export class UsersModule {}
