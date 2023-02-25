import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { Secret } from './model/secret.model';
import { SecretRepository } from './secret.repository';

@Module({
  imports: [TypegooseModule.forFeature([Secret])],
  providers: [SecretRepository, Secret],
  exports: [Secret, SecretRepository],
})
export class SecretModule {}
