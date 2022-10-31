import { prop } from '@typegoose/typegoose';
import { BaseModel } from 'src/base/base.model';
import { useMongoosePlugin } from 'src/base/decorators/use-mongoose-plugins.decorator';

@useMongoosePlugin()
export class Credentials extends BaseModel {
  @prop({ required: true })
  provider: string;

  @prop({ required: true })
  providerName: string;

  @prop({ required: true })
  providerImage: string;

  @prop({})
  providerUrl: string;

  @prop({ required: true })
  issuer: string;

  @prop({})
  issuerName: string;

  @prop({ required: true })
  defaultScore: number;

  @prop({})
  stampName: string;

  @prop({})
  stampDescription: string;
}
