import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { Card } from 'src/card/model/card.model';
import { Circle } from 'src/circle/model/circle.model';
import { Project } from 'src/project/model/project.model';
import { User } from 'src/users/model/users.model';

@Injectable({ scope: Scope.REQUEST })
export class RequestProvider {
  get user(): User {
    return this.req.user;
  }

  get card(): Card {
    return this.req.card;
  }

  get project(): Project {
    return this.req.project;
  }

  get circle(): Circle {
    return this.req.circle;
  }

  constructor(@Inject(REQUEST) private readonly req) {}
}
