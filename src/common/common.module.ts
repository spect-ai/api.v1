import { Module } from '@nestjs/common';
import { CommonTools } from './common.service';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [SlugService, DiscordService, GithubService, CommonTools],
  exports: [SlugService, DiscordService, GithubService, CommonTools],
})
export class CommonModule {}
