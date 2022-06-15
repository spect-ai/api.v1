import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './model/users.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersRepository } from './users.repository';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypegooseModule.forFeature([User]), EthAddressModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
