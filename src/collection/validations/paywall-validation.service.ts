import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ethers } from 'ethers';
import { NetworkModel, PayWallOptions, TokenModel } from '../types/types';

const supportedNetworks = [
  '1',
  '137',
  '43114',
  '42161',
  '10',
  '100',
  '56',
  '80001',
];

@ValidatorConstraint({ name: 'validConditions', async: false })
export class IsPaywallValidConstraint implements ValidatorConstraintInterface {
  validate(paywallOptions: PayWallOptions, args: ValidationArguments) {
    const validNetwork = validateNetwork(paywallOptions.network);
    if (!validNetwork) return false;
    const validReceiver = validateAddress(paywallOptions.receiver);
    if (!validReceiver) return false;
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Paywall is not valid';
  }
}

export function IsValidPaywallOptions(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsValidRewardOptions',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPaywallValidConstraint,
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

function validateAddress(receiver: string): boolean {
  if (receiver === ethers.constants.AddressZero || receiver.length !== 42)
    return false;
  return true;
}
