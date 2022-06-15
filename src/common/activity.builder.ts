import { Injectable } from '@nestjs/common';
import * as urlSlug from 'url-slug';
import { BaseRepository } from 'src/base/base.repository';
import { BaseModel } from 'src/base/base.model';
import { ActivityModel } from './models/activity.model';
import { v4 as uuidv4 } from 'uuid';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { UserProvider } from 'src/users/user.provider';
import { ObjectId } from 'mongoose';

export type ActivityParams = {
  type: string;
  newObj: Card | Circle;
  oldObj?: Card | Circle;
};

@Injectable()
export class ActivityBuilder {
  commitId: string;
  actorId: ObjectId;
  constructor() {
    this.commitId = uuidv4();
  }

  getActivity(
    userProvider: UserProvider,
    req: CreateCardRequestDto,
    oldObj?: Card,
  ): ActivityModel[] {
    this.actorId = userProvider.user?._id;
    let activity = [] as ActivityModel[];
    activity = this.buildNewCardActivity(activity, req);

    return activity;
  }

  buildNewCardActivity(
    activity: ActivityModel[],
    req: CreateCardRequestDto,
  ): ActivityModel[] {
    const newCardActivity = {} as ActivityModel;

    newCardActivity.description = `created card ${req.title}`;
    newCardActivity.timestamp = new Date();

    activity.push(newCardActivity);
    return activity;
  }

  buildUpdatedLabelsActivity(
    activity: ActivityModel,
    req: CreateCardRequestDto,
  ): ActivityModel {
    activity.description = `${
      this.actorId
    } added labels ${'asas'} and removed labels ${'asas'}`;

    return activity;
  }

  // buildUpdatedDeadlineActivity(
  //   activity: ActivityModel,
  //   req: CreateCardRequestDto,
  // ): ActivityModel {
  //   activity.description = `${
  //     this.actorId
  //   } added labels ${'asas'} and removed labels ${'asas'}`;

  //   return activity;
  // }

  // buildUpdatedRewardActivity(
  //   activity: ActivityModel,
  //   req: CreateCardRequestDto,
  // ): ActivityModel {
  //   activity.description = `${
  //     this.actorId
  //   } added labels ${'asas'} and removed labels ${'asas'}`;

  //   return activity;
  // }
}
