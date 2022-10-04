import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypegooseModule } from 'nestjs-typegoose';
import { CommonTools } from 'src/common/common.service';
import { LoggingService } from 'src/logging/logging.service';
import { EthAddressModule } from 'src/_eth-address/_eth-address.module';
import { CollectionController } from './collection.controller';
import { CollectionRepository } from './collection.repository';
import { CommandHandlers } from './commands';
import { Collection } from './model/collection.model';
import { QueryHandlers } from './queries';

@Module({
  imports: [
    TypegooseModule.forFeature([Collection]),
    CqrsModule,
    EthAddressModule,
  ],
  controllers: [CollectionController],
  providers: [
    ...QueryHandlers,
    ...CommandHandlers,
    CollectionRepository,
    CommonTools,
    LoggingService,
  ],
  exports: [CollectionModule],
})
export class CollectionModule {}
