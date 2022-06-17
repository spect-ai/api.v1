import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { RegistryModel } from './model/registry.model';
import { RegistryController } from './registry.controller';
import { RegistryRepository } from './registry.repository';

@Module({
  imports: [TypegooseModule.forFeature([RegistryModel])],
  controllers: [RegistryController],
  providers: [RegistryRepository],
  exports: [RegistryModule, RegistryRepository],
})
export class RegistryModule {}
