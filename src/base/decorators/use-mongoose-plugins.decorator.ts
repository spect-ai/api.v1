/* eslint-disable @typescript-eslint/no-var-requires */
import { applyDecorators } from '@nestjs/common';
import { plugin } from '@typegoose/typegoose';
const autoPopulate = require('mongoose-autopopulate');
const leanVirtuals = require('mongoose-lean-virtuals');

export const useMongoosePlugin = () =>
  applyDecorators(plugin(autoPopulate), plugin(leanVirtuals));
