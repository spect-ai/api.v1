import { Module } from '@nestjs/common';
import { ActivityBuilder } from './activity.builder';
import { DataStructureManipulationService } from './dataStructureManipulation.service';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [
    SlugService,
    DiscordService,
    GithubService,
    ActivityBuilder,
    DataStructureManipulationService,
  ],
  exports: [
    SlugService,
    DiscordService,
    GithubService,
    ActivityBuilder,
    DataStructureManipulationService,
  ],
})
export class CommonModule {}
