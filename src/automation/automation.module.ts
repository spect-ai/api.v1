import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CommonTools } from 'src/common/common.service';
import { DiscordService } from 'src/common/discord.service';
import { EncryptionService } from 'src/common/encryption.service';
import { GuildxyzService } from 'src/common/guildxyz.service';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { EmailGeneratorService } from 'src/notification/email-generatr.service';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { CommandHandlers } from './commands/handlers';
import { CommonActionService } from './commands/handlers/take -action-v2.handler';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [EthAddressModule, RequestProvider, CqrsModule],
  controllers: [],
  providers: [
    EthAddressService,
    CommonTools,
    RequestProvider,
    ...CommandHandlers,
    ...QueryHandlers,
    LoggingService,
    MailService,
    CommonActionService,
    EmailGeneratorService,
    DiscordService,
    EncryptionService,
    GuildxyzService,
  ],
})
export class AutomationModule {}
