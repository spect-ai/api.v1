import { prop, Ref } from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';
import { User } from 'src/users/model/users.model';

export type Stats = {
  [key: string]: StatsModel;
};

export abstract class StatsModel {
  /**
   * The chainId of the chain
   */
  @prop({ ref: () => User, required: true })
  owner?: ObjectId;

  /**
   * The votes given by stats owner
   */
  @prop()
  votesGiven?: object;

  /**
   * The votes remaining of stats owner
   */
  @prop()
  votesRemaining?: number;

  /**
   * The votes allocated to stats owner
   */
  @prop()
  votesAllocated?: number;

  /**
   * Can give votes to other members
   */
  @prop()
  canGive?: boolean;

  /**
   * Can receive votes from other members
   */
  @prop()
  canReceive?: boolean;
}
