import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { LookupRepository } from './lookup.repository';
import { Lookup } from './model/lookup.model';

@Module({
  imports: [TypegooseModule.forFeature([Lookup])],
  providers: [LookupRepository, Lookup],
  exports: [LookupRepository, Lookup],
})
export class LookupModule {}
