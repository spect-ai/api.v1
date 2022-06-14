import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
    },
    strictQuery: 'throw',
  },
})
export abstract class BaseModel {
  @prop()
  createdAt: Date; // provided by schemaOptions.timestamps
  @prop()
  updatedAt: Date; // provided by schemaOptions.timestamps
  id: string; // _id getter as string
  _id: ObjectId;
}
