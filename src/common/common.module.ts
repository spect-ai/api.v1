import { Module } from '@nestjs/common';
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
    DataStructureManipulationService,
  ],
  exports: [
    SlugService,
    DiscordService,
    GithubService,
    DataStructureManipulationService,
  ],
})
export class CommonModule {}
