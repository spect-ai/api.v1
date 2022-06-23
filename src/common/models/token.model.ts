import { prop } from '@typegoose/typegoose';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

export type Token = {
  /**
   * The address of the token, it is set to '0x0' if its a currency
   */
  address: string;

  /**
   * The symbol of the token
   */
  symbol: string;
};
