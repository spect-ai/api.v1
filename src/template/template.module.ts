import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { AuthModule } from 'src/auth/auth.module';
import { Keys } from 'src/users/model/keys.model';
import { TypegooseModule } from 'nestjs-typegoose';
import { UsersModule } from 'src/users/users.module';
import { EncryptionService } from 'src/common/encryption.service';
import { TemplateService } from './template.service';
import { CommonTools } from 'src/common/common.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Keys]),
    CqrsModule,
    EthAddressModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [TemplateController],
  providers: [EncryptionService, TemplateService, CommonTools],
})
export class TemplateModule {}
