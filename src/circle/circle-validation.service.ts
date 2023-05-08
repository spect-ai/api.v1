import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Circle } from './model/circle.model';

@Injectable()
export class CircleValidationService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  validateNewMember(circle: Circle, newMember: string) {
    const members = circle.members.map((m) => m.toString());
    if (
      members.includes(newMember) &&
      !circle.memberRoles[newMember].includes('__left__') &&
      !circle.memberRoles[newMember].includes('__removed__')
    ) {
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
    const rolesAreSubset = roles.every(
      (role) =>
        Object.keys(circle.roles).includes(role) ||
        ['__removed__', '__left__'].includes(role),
    );
    if (!rolesAreSubset) {
      throw new HttpException(
        'Roles are not a subset of existing roles in the circle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  validateRolesAreMutable(circle: Circle, roles: string[]) {
    const rolesAreMutable = roles.every((role) => circle.roles[role].mutable);
    if (!rolesAreMutable) {
      throw new HttpException(
        'Roles are not mutable',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
