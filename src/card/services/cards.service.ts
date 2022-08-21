import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { MappedPartialItem } from 'src/common/interfaces';
import { LoggingService } from 'src/logging/logging.service';
import { Project } from 'src/project/model/project.model';
import { UpdateCardRequestDto } from '../dto/update-card-request.dto';
import { Card } from '../model/card.model';
import { Diff } from '../types/types';

@Injectable()
export class CardsService {
  constructor(
    private readonly commonTools: CommonTools,
    private readonly logger: LoggingService,
  ) {
    logger.setContext('CardsService');
  }

  getDifference(card: Card, request: UpdateCardRequestDto): Diff {
    const filteredCard = {};
    const filteredCardArrayFields = {};
    const filteredRequest = {};

    for (const key in request) {
      if (Array.isArray(card[key])) filteredCardArrayFields[key] = card[key];
      else {
        filteredCard[key] = card[key];
        filteredRequest[key] = request[key];
      }
    }

    const objDiff = this.commonTools.findDifference(
      filteredCard,
      filteredRequest,
    ) as Diff;
    const arrayDiff = {};
    for (const key in filteredCardArrayFields) {
      arrayDiff[key] = this.commonTools.findDifference(
        filteredCardArrayFields[key],
        request[key],
      );
      if (arrayDiff[key]['added'].length > 0) {
        objDiff['added'] = {
          ...objDiff['added'],
          [key]: arrayDiff[key]['added'],
        };
      }
      if (arrayDiff[key]['removed'].length > 0) {
        objDiff['deleted'] = {
          ...objDiff['deleted'],
          [key]: arrayDiff[key]['removed'],
        };
      }
    }
    return objDiff;
  }

  merge(
    updatedItem: MappedPartialItem<Card | Project>,
    itemAfterAutomation: MappedPartialItem<Card | Project>,
  ): MappedPartialItem<Card | Project> {
    if (itemAfterAutomation && updatedItem) {
      for (const [itemId, item] of Object.entries(itemAfterAutomation)) {
        if (updatedItem.hasOwnProperty(itemId)) {
          console.log(item);
          console.log(updatedItem[itemId]);
          updatedItem[itemId] = this.commonTools.mergeObjects(
            item,
            updatedItem[itemId],
          );
        } else {
          updatedItem[itemId] = item;
        }
      }
      return updatedItem;
    } else if (updatedItem) return updatedItem;
    else if (itemAfterAutomation) return itemAfterAutomation;
    else return {};
  }
}
