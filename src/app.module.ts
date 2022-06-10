import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsModule } from './cats/cats.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EthAddressService } from './_eth-address/_eth-address.service';
import { EthAddressModule } from './_eth-address/_eth-address.module';

@Module({
  imports: [
    TypegooseModule.forRoot('mongodb://localhost:27017/nest'),
    CatsModule,
    UsersModule,
    AuthModule,
    EthAddressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
