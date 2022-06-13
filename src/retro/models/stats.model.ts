import { prop, Ref } from '@typegoose/typegoose';
import { User } from 'src/users/model/users.model';

export abstract class StatsModel {
  /**
   * The chainId of the chain
   */
  @prop({ required: true })
  owner?: Ref<User>;

  /**
   * The votes given by stats owner
   */
  @prop()
  votesGiven?: object;

  /**
   * The votes remaining of stats owner
   */
  @prop()
  votesRemaining?: object;

  /**
   * The votes allocated to stats owner
   */
  @prop()
  votesAllocated?: object;
}
