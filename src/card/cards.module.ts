import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { SlugService } from 'src/common/slug.service';
import { UserProvider } from 'src/users/user.provider';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { Card } from './model/card.model';

@Module({
  imports: [TypegooseModule.forFeature([Card])],
  controllers: [CardsController],
  providers: [CardsService, CardsRepository, SlugService, UserProvider],
  exports: [CardsService, CardsRepository, CardsModule],
})
export class CardsModule {}
