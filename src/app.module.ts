import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CirclesModule } from './circles/circles.module';
import { UsersModule } from './users/users.module';
import { EthAddressModule } from './_eth-address/_eth-address.module';

@Module({
  imports: [
    TypegooseModule.forRoot('mongodb://localhost:27017/nest'),
    CirclesModule,
    UsersModule,
    AuthModule,
    EthAddressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
