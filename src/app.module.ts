import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsModule } from './cats/cats.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CirclesController } from './circles/circles.controller';
import { CirclesService } from './circles/circles.service';
import { CirclesModule } from './circles/circles.module';

@Module({
  imports: [
    TypegooseModule.forRoot('mongodb://localhost:27017/nest'),
    CirclesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
