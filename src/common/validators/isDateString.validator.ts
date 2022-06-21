import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import moment from 'moment';

export function isTest(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isTest',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return false;
        },
      },
    });
  };
}
