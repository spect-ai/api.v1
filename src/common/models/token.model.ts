import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export abstract class TokenModel {
  /**
   * The address of the token, it is set to '0x0' if its a currency
   */
  @prop()
  address?: string;

  /**
   * The symbol of the token
   */
  @prop()
  symbol?: string;
}
