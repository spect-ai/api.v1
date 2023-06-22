import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggingService } from 'src/logging/logging.service';
import { CommonTools } from './common.service';
import { DiscordService } from './discord.service';
import { GithubService } from './github.service';
import { GuildxyzService } from './guildxyz.service';
import { SlugService } from './slug.service';
import { AuthTokenRefreshService } from './authTokenRefresh.service';
import { EncryptionService } from './encryption.service';
import { SecretModule } from 'src/secretRegistry/secret.module';
import { CommonController } from './common.controller';
import { GasPredictionService } from './gas-prediction.service';
import { CqrsModule } from '@nestjs/cqrs';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [ScheduleModule.forRoot(), SecretModule, CqrsModule],
  controllers: [CommonController],
  providers: [
    SlugService,
    DiscordService,
    GithubService,
    CommonTools,
    GuildxyzService,
    AuthTokenRefreshService,
    LoggingService,
    EncryptionService,
    GasPredictionService,
    ...QueryHandlers,
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
