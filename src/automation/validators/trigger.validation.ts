import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { triggerIdToQueryHandlerMap } from '../queries/impl/is-triggered.query';
import {
  BasicTrigger,
  CardCreateTrigger,
  ColumnCreateTrigger,
  ColumnDeleteTrigger,
  ColumnPositionUpdateTrigger,
  DeadlineChangeTrigger,
  MemberChangeTrigger,
  ProjectCreateTrigger,
  StatusChangeTrigger,
  Trigger,
} from '../types/types';
import { IsArray } from 'class-validator';

const triggerIdToValidationMap = {
  statusChange: validateStatusChangeTrigger,
  columnChange: validateBasicTrigger,
  priorityChange: validateBasicTrigger,
  deadlineChange: validateDeadlineTrigger,
  assigneeChange: validateMemberChangeTrigger,
  reviewerChange: validateMemberChangeTrigger,
  typeChange: validateBasicTrigger,
  cardCreate: validateCardCreatedTrigger,
  projectCreate: validateProjectCreatedTrigger,
  columnCreate: validateColumnCreatedTrigger,
  columnDelete: validateColumnDeletedTrigger,
  columnPositionUpdate: validateColumnPositionUpdateTrigger,
};

@ValidatorConstraint({ name: 'validTrigger', async: false })
export class IsUserAlreadyExistConstraint
  implements ValidatorConstraintInterface
{
  validate(trigger: Trigger, args: ValidationArguments) {
    if (!trigger || !trigger.id || !trigger.item) return false;
    if (!(trigger.id in triggerIdToQueryHandlerMap)) {
      return false;
    }
    return triggerIdToValidationMap[trigger.id](trigger.item);
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'trigger is not valid';
  }
}

export function IsValidTrigger(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsValidTrigger',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserAlreadyExistConstraint,
    });
  };
}

function validateStatusChangeTrigger(item: StatusChangeTrigger) {
  // Check type of from and to
  if (
    !item.from ||
    !item.to ||
    typeof item.from !== 'object' ||
    typeof item.to !== 'object'
  )
    return false;
  const fromKeys = Object.keys(item.from);
  const toKeys = Object.keys(item.to);

  // Make sure all keys are valid
  const validKeys = ['active', 'archived', 'paid'];
  const isValidKey =
    fromKeys.every((val) => validKeys.includes(val)) &&
    toKeys.every((val) => validKeys.includes(val));
  if (!isValidKey) return false;

  // Check both from and to have the same keys
  if (
    JSON.stringify(Object.keys(item.from)) !==
    JSON.stringify(Object.keys(item.to))
  )
    return false;

  // Check from and to have different values
  for (const key of fromKeys) {
    if (item.from[key] === item.to[key]) {
      return false;
    }
  }
  return true;
}

function validateMemberChangeTrigger(item: MemberChangeTrigger) {
  // TODO: Add validation for when values are empty strings or boolean or 0

  if (
    (item.from && !Array.isArray(item.from)) ||
    (item.to && !Array.isArray(item.to)) ||
    (item.fromNotEmptyToEmpty &&
      typeof item.fromNotEmptyToEmpty !== 'boolean') ||
    (item.fromEmptytoNotEmpty &&
      typeof item.fromEmptytoNotEmpty !== 'boolean') ||
    (item.countReducedFrom && typeof item.countReducedFrom !== 'number') ||
    (item.countIncreasedFrom && typeof item.countIncreasedFrom !== 'number')
  )
    return false;

  return true;
}

function validateBasicTrigger(item: BasicTrigger) {
  if (
    (item.from === 'undefined' || item.from === 'null') &&
    (item.to === 'undefined' || item.to === 'null')
  )
    return false;
  return true;
}

function validateDeadlineTrigger(item: DeadlineChangeTrigger) {
  if (!item.before && !item.after && !item.between) return false;
  return true;
}

function validateCardCreatedTrigger(item: CardCreateTrigger) {
  if (!item.projectId) return false;
  return true;
}

function validateProjectCreatedTrigger(item: ProjectCreateTrigger) {
  return true;
}

function validateColumnCreatedTrigger(item: ColumnCreateTrigger) {
  return true;
}

function validateColumnDeletedTrigger(item: ColumnDeleteTrigger) {
  return true;
}

function validateColumnPositionUpdateTrigger(
  item: ColumnPositionUpdateTrigger,
) {
  return true;
}
