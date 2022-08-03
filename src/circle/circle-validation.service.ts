import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Circle } from './model/circle.model';

@Injectable()
export class CircleValidationService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  validateNewMember(circle: Circle, newMember: string) {
    const members = circle.members.map((m) => m.toString());
    if (members.includes(newMember)) {
      throw new HttpException(
        'You are already a member of this circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateExistingMember(circle: Circle, member: string) {
    const members = circle.members.map((m) => m.toString());
    if (!members.includes(member)) {
      throw new HttpException(
        'Member doesnt exist in the circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateRolesExistInCircle(circle: Circle, roles: string[]) {
    const rolesAreSubset = roles.every((role) =>
      Object.keys(circle.roles).includes(role),
    );
    if (!rolesAreSubset) {
      throw new HttpException(
        'Roles are not a subset of existing roles in the circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
