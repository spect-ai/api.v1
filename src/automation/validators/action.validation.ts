import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Action } from '../types/types';

const actionIdToValidationMap = {};

@ValidatorConstraint({ name: 'validActions', async: false })
export class IsUserAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  validate(actions: Action[], args: ValidationArguments) {
    if (!actions || !Array.isArray(actions)) return false;
    for (const action of actions) {
      if (!action.id || !action.item) return false;
      if (!(action.id in actionIdToValidationMap)) {
        return false;
      }
      if (!actionIdToValidationMap[action.id](action.item)) {
        return false;
      }
    }
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'action is not valid';
  }
}

export function IsValidAction(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsValidAction',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserAlreadyExistConstraint,
    });
  };
}
