import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { Circle } from './model/circle.model';
import { CirclesRepository } from './circles.repository';
import { SlugService } from 'src/common/slug.service';
import { RequestProvider } from 'src/users/user.provider';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { RolesService } from 'src/roles/roles.service';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { CircleRegistryService } from './registry.circle.service';
import { RegistryModule } from 'src/registry/registry.module';

@Module({
  imports: [
    TypegooseModule.forFeature([Circle]),
    EthAddressModule,
    RegistryModule,
  ],
  controllers: [CirclesController],
  providers: [
    CirclesService,
    CirclesRepository,
    SlugService,
    RequestProvider,
    DiscordService,
    GithubService,
    RolesService,
    DataStructureManipulationService,
    CircleRegistryService,
  ],
  exports: [CirclesService, CirclesRepository, CirclesModule],
})
export class CirclesModule {}
