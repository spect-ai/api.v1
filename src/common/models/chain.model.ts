import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

export abstract class ChainModel {
  /**
   * The chainId of the chain
   */
  @prop()
  chainId?: string;

  /**
   * The name of the chain
   */
  @prop()
  name?: string;
}
