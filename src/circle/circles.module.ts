import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { Circle } from './model/circle.model';
import { CirclesRepository } from './circles.repository';
import { SlugService } from 'src/common/slug.service';
import { UserProvider } from 'src/users/user.provider';
import { DiscordService } from 'src/common/discord.service';
import { GithubService } from 'src/common/github.service';

@Module({
  imports: [TypegooseModule.forFeature([Circle])],
  controllers: [CirclesController],
  providers: [
    CirclesService,
    CirclesRepository,
    SlugService,
    UserProvider,
    DiscordService,
    GithubService,
  ],
  exports: [CirclesService, CirclesRepository, CirclesModule],
})
export class CirclesModule {}
