import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { Circle } from 'src/circle/model/circle.model';
import { User } from 'src/users/model/users.model';

@Injectable({ scope: Scope.REQUEST })
export class RequestProvider {
  get user(): User {
    return this.req.user;
  }

  get circle(): Circle {
    return this.req.circle;
  }

  get body(): object {
    return this.req.body;
  }

  get params(): object {
    return this.req.params;
  }

  get url(): object {
    return this.req.url;
  }

  get query(): object {
    return this.req.query;
  }

  get method(): string {
    return this.req.method;
  }

  constructor(@Inject(REQUEST) private readonly req) {}
}
