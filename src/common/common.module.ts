import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingService } from 'src/logging/logging.service';
import { CommonTools } from './common.service';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { GuildxyzService } from './guildxyz.service';
import { SlugService } from './slug.service';
import { AuthTokenRefreshService } from './authTokenRefresh.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [],
  providers: [
    SlugService,
    DiscordService,
    GithubService,
    CommonTools,
    GuildxyzService,
    AuthTokenRefreshService,
    LoggingService,
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
