import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { LoggingService } from 'src/logging/logging.service';
import { WithdrawBonusCommand } from '../impl/withdraw-bonus.command';
import { GetCirclesByFilterQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';
import { UpdateCircleCommand } from 'src/circle/commands/impl/update-circle.command';
import { ethers } from 'ethers';
import { RegistryService } from 'src/registry/registry.service';
import { USDTAbi } from 'src/common/abis/usdt';
import { InternalServerErrorException } from '@nestjs/common';

@CommandHandler(WithdrawBonusCommand)
export class WithdrawBonusCommandHandler
  implements ICommandHandler<WithdrawBonusCommand>
{
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggingService,
    private readonly registryService: RegistryService,
  ) {
    this.logger.setContext('AddItemCommandHandler');
  }

  async execute(command: WithdrawBonusCommand) {
    try {
      console.log('Get referral code command handler');
      const { user } = command;
      const circles: Circle[] = await this.queryBus.execute(
        new GetCirclesByFilterQuery({
          referredBy: user.referralCode,
          pendingBonus: { $gt: 0 },
        }),
      );
      if (!circles.length) throw new Error('No pending bonus');
      const txHash = await this.withdrawBonus(
        user.ethAddress,
        circles.reduce((acc, circle) => acc + circle.pendingBonus, 0),
      );
      // update pending bonus to 0
      for await (const circle of circles) {
        await this.commandBus.execute(
          new UpdateCircleCommand(
            circle.id,
            { pendingBonus: 0 } as any,
            user.id,
          ),
        );
      }
      return txHash;
    } catch (error) {
      console.log({ error });
      this.logger.error(`Failed withdrawing bonus: ${error.message}`, command);
      throw new InternalServerErrorException(
        `Failed withdrawing bonus: ${error.message}`,
      );
    }
  }

  async withdrawBonus(address: string, amount: number) {
    console.log({ address, amount });
    const registry = await this.registryService.getRegistry();
    const provider = new ethers.providers.JsonRpcProvider(
      registry['80001'].provider,
    );
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const USDTContract = new ethers.Contract(
      '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
      USDTAbi,
      signer,
    );

    const amountInWei = ethers.utils.parseUnits(
      (amount / 100).toString(),
      await USDTContract.decimals(),
    );

    console.log({ amountInWei });

    const tx = await USDTContract.transfer(address, amountInWei);
    await tx.wait();
    // TODO: Withdraw bonus
    console.log({ tx });
    return {
      txHash: tx.hash,
      txUrl: `${registry['80001'].blockExplorer}/tx/${tx.hash}`,
    };
  }
}
