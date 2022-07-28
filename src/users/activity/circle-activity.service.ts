import { Injectable } from '@nestjs/common';
import { Circle } from 'src/circle/model/circle.model';
import { Reference } from '../types/types';

@Injectable()
export class CircleActivityService {
  generateCardContent(
    actionType: string,
    circle: Circle,
  ): { content: string; ref: Reference } {
    console.log(actionType);
    switch (actionType) {
      case 'create':
        return this.createCircleActivity(circle);
      case 'delete':
        return this.deleteCircleActivity(circle);
      default:
        return null;
    }
  }

  createCircleActivity(circle: Circle): { content: string; ref: Reference } {
    return {
      content: `created a new circle ${circle.name}`,
      ref: {},
    };
  }

  deleteCircleActivity(circle: Circle): { content: string; ref: Reference } {
    return {
      content: `deleted circle ${circle.name}`,
      ref: {},
    };
  }
}
