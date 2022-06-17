import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { DataStructureManipulationService } from 'src/common/dataStructureManipulation.service';
import { Registry } from './model/registry.model';
import { RegistryController } from './registry.controller';
import { RegistryRepository } from './registry.repository';
import { RegistryService } from './registry.service';

@Module({
  imports: [TypegooseModule.forFeature([Registry])],
  controllers: [RegistryController],
  providers: [
    RegistryRepository,
    RegistryService,
    DataStructureManipulationService,
  ],
  exports: [RegistryModule, RegistryRepository, RegistryService],
})
export class RegistryModule {}
