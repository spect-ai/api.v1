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

@Module({
  imports: [TypegooseModule.forFeature([Circle]), EthAddressModule],
  controllers: [CirclesController],
  providers: [
    CirclesService,
    CirclesRepository,
    SlugService,
    RequestProvider,
    DiscordService,
    GithubService,
    RolesService,
  ],
  exports: [CirclesService, CirclesRepository, CirclesModule],
})
export class CirclesModule {}
