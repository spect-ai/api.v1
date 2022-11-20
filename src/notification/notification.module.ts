import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { MailService } from 'src/mail/mail.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { EmailGeneratorService } from './email-generatr.service';

@Module({
  imports: [CqrsModule, EthAddressModule],
  providers: [NotificationService, MailService, EmailGeneratorService],
  controllers: [NotificationController],
})
export class NotificationModule {}
