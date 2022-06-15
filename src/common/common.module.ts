import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [SlugService, DiscordService, GithubService],
  exports: [SlugService, DiscordService, GithubService],
})
export class CommonModule {}
