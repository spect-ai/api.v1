import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CommonTools } from 'src/common/common.service';
import { Registry } from './model/registry.model';
import { RegistryController } from './registry.controller';
import { RegistryRepository } from './registry.repository';
import { RegistryService } from './registry.service';

@Module({
  imports: [TypegooseModule.forFeature([Registry])],
  controllers: [RegistryController],
  providers: [RegistryRepository, RegistryService, CommonTools],
  exports: [RegistryModule, RegistryRepository, RegistryService],
})
export class RegistryModule {}
