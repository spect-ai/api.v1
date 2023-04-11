import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { NetworkModel, TokenModel } from '../types/types';

const supportedNetworks = [
  '1',
  '137',
  '43113',
  '43114',
  '42161',
  '80001',
  '10',
  '100',
  '56',
  '80001',
  '5',
];

@ValidatorConstraint({ name: 'validConditions', async: false })
export class IsRewardValidConstraint implements ValidatorConstraintInterface {
  validate(
    rewardOptions: Map<string, NetworkModel>,
    args: ValidationArguments,
  ) {
    const validNetwork = validateNetwork(rewardOptions);
    if (!validNetwork) return false;
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'reward is not valid';
  }
}

export function IsValidRewardOptions(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsValidRewardOptions',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsRewardValidConstraint,
    });
  };
}

function validateNetwork(networks: Map<string, NetworkModel>): boolean {
  for (const [chainId, network] of Object.entries(networks)) {
    const supportedNetwork = supportedNetworks.includes(chainId);
    const hasNameString = typeof network.name === 'string';
    const hasChainIdString = typeof network.chainId === 'string';
    const hasTokens = typeof network.tokenDetails === 'object';
    if (
      !supportedNetwork ||
      !hasNameString ||
      !hasChainIdString ||
      !hasTokens
    ) {
      return false;
    }

    const validTokens = validateTokens(network.tokenDetails);
    if (!validTokens) return false;
  }
  return true;
}

function validateTokens(tokens: Map<string, TokenModel>): boolean {
  for (const [address, token] of Object.entries(tokens)) {
    const hasNameString = typeof token.name === 'string';
    const hasSymbolString = typeof token.symbol === 'string';
    const hasAddressString = typeof token.address === 'string';
    if (!hasNameString || !hasSymbolString || !hasAddressString) {
      return false;
    }
  }
  return true;
}
