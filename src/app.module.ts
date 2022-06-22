import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CirclesModule } from './circle/circles.module';
import { UsersModule } from './users/users.module';
import { EthAddressModule } from './_eth-address/_eth-address.module';
import { CommonModule } from './common/common.module';
import { ProjectService } from './project/project.service';
import { ProjectController } from './project/project.controller';
import { ProjectModule } from './project/project.module';
import { TemplatesService } from './template/templates.service';
import { TemplatesModule } from './template/templates.module';
import { RetroService } from './retro/retro.service';
import { RetroModule } from './retro/retro.module';
import { RegistryService } from './registry/registry.service';
import { RegistryModule } from './registry/registry.module';
import { CardsController } from './card/cards.controller';
import { CardsService } from './card/cards.service';
import { CardsModule } from './card/cards.module';
import { RequestProvider } from './users/user.provider';
import { IntegrationsModule } from './integrations/integrations.module';
import { TemplatesController } from './template/templates.controller';
import { RolesService } from './roles/roles.service';
import { RegistryController } from './registry/registry.controller';
import { ActionService } from './card/actions.service';
import { ActivityBuilder } from './card/activity.builder';

@Module({
  imports: [
    TypegooseModule.forRoot('mongodb://localhost:27017/nest'),
    CirclesModule,
    UsersModule,
    AuthModule,
    EthAddressModule,
    CommonModule,
    ProjectModule,
    TemplatesModule,
    RetroModule,
    RegistryModule,
    CardsModule,
    IntegrationsModule,
    RegistryModule,
  ],
  controllers: [
    AppController,
    ProjectController,
    CardsController,
    TemplatesController,
    RegistryController,
  ],
  providers: [
    AppService,
    ProjectService,
    TemplatesService,
    RetroService,
    RegistryService,
    CardsService,
    RequestProvider,
    RolesService,
    RegistryService,
    ActionService,
    ActivityBuilder,
  ],
})
export class AppModule {}
