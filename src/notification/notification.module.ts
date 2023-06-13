import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MailService } from 'src/mail/mail.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { EmailGeneratorService } from './email-generatr.service';

@Module({
  imports: [CqrsModule, EthAddressModule],
  providers: [MailService, EmailGeneratorService],
})
export class NotificationModule {}
