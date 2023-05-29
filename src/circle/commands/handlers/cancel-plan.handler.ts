import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CancelPlanCommand } from '../impl/cancel-plan.command';
import Stripe from 'stripe';

@CommandHandler(CancelPlanCommand)
export class CancelPlanCommandHandler
  implements ICommandHandler<CancelPlanCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: CancelPlanCommand) {
    try {
      const { id } = command;
      const circle = await this.circlesRepository.findById(id);
      const stripe = new Stripe(process.env.STRIPE_PVT_KEY, {
        apiVersion: '2022-11-15',
      });
      // cancel subscription
      await stripe.subscriptions.del(circle.subscriptionId);
      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
