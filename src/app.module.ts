import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CirclesModule } from './circles/circles.module';
import { UsersModule } from './users/users.module';
import { EthAddressModule } from './_eth-address/_eth-address.module';
import { CommonModule } from './common/common.module';
import { ProjectService } from './project/project.service';
import { ProjectController } from './project/project.controller';
import { ProjectModule } from './project/project.module';
import { TemplatesService } from './templates/templates.service';
import { TemplatesModule } from './templates/templates.module';
import { RetroService } from './retro/retro.service';
import { RetroModule } from './retro/retro.module';
import { RegistryService } from './registry/registry.service';
import { RegistryModule } from './registry/registry.module';
import { CardsController } from './cards/cards.controller';
import { CardsService } from './cards/cards.service';
import { CardsModule } from './cards/cards.module';
import { HookModule } from './hooks/hook.module';

@Module({
  imports: [
    TypegooseModule.forRoot('mongodb://localhost:27017/nest'),
    CirclesModule,
    UsersModule,
    AuthModule,
    EthAddressModule,
    CommonModule,
    HookModule,
    ProjectModule,
    TemplatesModule,
    RetroModule,
    RegistryModule,
    CardsModule,
  ],
  controllers: [AppController, ProjectController, CardsController],
  providers: [
    AppService,
    ProjectService,
    TemplatesService,
    RetroService,
    RegistryService,
    CardsService,
  ],
})
export class AppModule {}
