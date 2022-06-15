import { Module } from '@nestjs/common';
import { ActivityBuilder } from './activity.builder';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [SlugService, DiscordService, GithubService, ActivityBuilder],
  exports: [SlugService, DiscordService, GithubService, ActivityBuilder],
})
export class CommonModule {}
