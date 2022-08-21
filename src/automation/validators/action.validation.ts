import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  Action,
  ChangeLabelAction,
  ChangeMemberAction,
  ChangeSimpleFieldAction,
  ChangeStatusAction,
} from '../types/types';

const actionIdToValidationMap = {
  changeStatus: validateChangeStatusAction,
  changeMember: validateChangeMemberAction,
  changeSimpleField: validateChangeSimpleFieldAction,
  changeLabel: validateChangeLabelAction,
  changeColumn: validateChangeSimpleFieldAction,
  createColumn: validateChangeSimpleFieldAction,
  close: validateChangeSimpleFieldAction,
  closeParentCard: validateChangeSimpleFieldAction,
  changeAssignee: validateChangeMemberAction,
};

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

function validateChangeStatusAction(item: ChangeStatusAction) {
  return true;
}

function validateChangeMemberAction(item: ChangeMemberAction) {
  return true;
}

function validateChangeSimpleFieldAction(item: ChangeSimpleFieldAction) {
  return true;
}

function validateChangeLabelAction(item: ChangeLabelAction) {
  return true;
}
