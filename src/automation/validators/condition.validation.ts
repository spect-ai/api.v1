import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  BasicCondition,
  Condition,
  MemberCondition,
  DeadlineCondition,
} from '../types/types';

const conditionIdToValidationMap = {
  checkStatus: validateStatusCondition,
  checkColumn: validateBasicCondition,
  checkParent: validateBasicCondition,
  checkDeadline: validateDeadlineCondition,
  checkAssignee: validateMemberChangeCondition,
  checkReviewer: validateMemberChangeCondition,
  checkCardsOnSameLevel: validateBasicCondition,
};

@ValidatorConstraint({ name: 'validConditions', async: false })
export class IsUserAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  validate(conditions: Condition[], args: ValidationArguments) {
    if (!conditions || !Array.isArray(conditions)) return false;
    for (const condition of conditions) {
      if (!condition.id || !condition.item) return false;
      if (!(condition.id in conditionIdToValidationMap)) {
        return false;
      }
      if (!conditionIdToValidationMap[condition.id](condition.item)) {
        return false;
      }
    }
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'condition is not valid';
  }
}

export function IsValidCondition(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsValidCondition',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserAlreadyExistConstraint,
    });
  };
}

function validateStatusCondition(item: BasicCondition) {
  return true;
}

function validateBasicCondition(item: BasicCondition) {
  return true;
}

function validateMemberChangeCondition(item: MemberCondition) {
  return true;
}
function validateDeadlineCondition(item: DeadlineCondition) {
  return true;
}
