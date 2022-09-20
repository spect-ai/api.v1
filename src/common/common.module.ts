import { Module } from '@nestjs/common';
import { CommonTools } from './common.service';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { GuildxyzService } from './guildxyz.service';
import { SlugService } from './slug.service';

@Module({
  controllers: [],
  providers: [
    SlugService,
    DiscordService,
    GithubService,
    CommonTools,
    GuildxyzService,
  ],
  exports: [
    SlugService,
    DiscordService,
    GithubService,
    CommonTools,
    GuildxyzService,
  ],
})
export class CommonModule {}
