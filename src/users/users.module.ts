import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './model/users.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersRepository } from './users.repository';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { AuthModule } from 'src/auth/auth.module';
import { RequestProvider } from './user.provider';
import { CardsModule } from 'src/card/cards.module';
import { CommonTools } from 'src/common/common.service';

@Module({
  imports: [
    TypegooseModule.forFeature([User]),
    EthAddressModule,
    forwardRef(() => CardsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, RequestProvider, CommonTools],
  exports: [UsersService, UsersRepository, UsersModule],
})
export class UsersModule {}
