import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { User } from 'src/users/model/users.model';

@Injectable({ scope: Scope.REQUEST })
export class RequestProvider {
  get user(): User {
    return this.req.user;
  }

  constructor(@Inject(REQUEST) private readonly req) {}
}
