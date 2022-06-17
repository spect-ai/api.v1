import { forwardRef, Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { ProjectModule } from 'src/project/project.module';
import { RequestProvider } from 'src/users/user.provider';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { Template } from './models/template.model';
import { TemplatesRepository } from './tempates.repository';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [
    TypegooseModule.forFeature([Template]),
    forwardRef(() => ProjectModule),
    CirclesModule,
    EthAddressModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesRepository, TemplatesService, RequestProvider],
  exports: [TemplatesRepository, TemplatesService, TemplatesModule],
})
export class TemplatesModule {}
