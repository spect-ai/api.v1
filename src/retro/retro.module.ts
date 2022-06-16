import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { CirclesModule } from 'src/circle/circles.module';
import { SlugService } from 'src/common/slug.service';
import { UserProvider } from 'src/users/user.provider';
import { Retro } from './models/retro.model';
import { RetroController } from './retro.controller';
import { RetroRepository } from './retro.repository';
import { RetroService } from './retro.service';

@Module({
  imports: [TypegooseModule.forFeature([Retro]), CirclesModule],
  controllers: [RetroController],
  providers: [RetroService, RetroRepository, SlugService, UserProvider],
  exports: [RetroService, RetroRepository, RetroModule],
})
export class RetroModule {}
