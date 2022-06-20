import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';
import { BaseRepository } from 'src/base/base.repository';
import { BaseModel } from 'src/base/base.model';
import { Activity } from './types/activity.type';
import { v4 as uuidv4 } from 'uuid';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { RequestProvider } from 'src/users/user.provider';
import { ObjectId } from 'mongoose';

export type ActivityParams = {
  type: string;
  newObj: Card | Circle;
  oldObj?: Card | Circle;
};

@Injectable()
export class ActivityBuilder {
  commitId: string;
  actorId: string;
  constructor() {
    this.commitId = uuidv4();
  }

  getActivity(
    requestProvider: RequestProvider,
    req: CreateCardRequestDto,
    oldObj?: Card,
  ): Activity[] {
    this.actorId = requestProvider.user?.id;
    let activity = [] as Activity[];
    activity = this.buildNewCardActivity(activity, req);

    return activity;
  }

  buildNewCardActivity(
    activity: Activity[],
    req: CreateCardRequestDto,
  ): Activity[] {
    const newCardActivity = {} as Activity;

    newCardActivity.content = `created card ${req.title}`;
    newCardActivity.timestamp = new Date();
    newCardActivity.actorId = this.actorId;
    newCardActivity.commitId = this.commitId;
    newCardActivity.comment = false;

    activity.push(newCardActivity);
    return activity;
  }

  buildUpdatedLabelsActivity(
    activity: Activity,
    req: CreateCardRequestDto,
  ): Activity {
    activity.content = `${
      this.actorId
    } added labels ${'asas'} and removed labels ${'asas'}`;

    return activity;
  }

  // buildUpdatedDeadlineActivity(
  //   activity: Activity,
  //   req: CreateCardRequestDto,
  // ): Activity {
  //   activity.description = `${
  //     this.actorId
  //   } added labels ${'asas'} and removed labels ${'asas'}`;

  //   return activity;
  // }

  // buildUpdatedRewardActivity(
  //   activity: Activity,
  //   req: CreateCardRequestDto,
  // ): Activity {
  //   activity.description = `${
  //     this.actorId
  //   } added labels ${'asas'} and removed labels ${'asas'}`;

  //   return activity;
  // }
}
