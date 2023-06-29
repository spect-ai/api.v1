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
      if (circle.parents.length > 0) {
        throw new InternalServerErrorException(
          'You can only cancel plan from the parent circle',
        );
      }
      const stripe = new Stripe(process.env.STRIPE_PVT_KEY, {
        apiVersion: '2022-11-15',
      });
      console.log({ circle: circle.subscriptionId });
      // cancel subscription
      await stripe.subscriptions.del(circle.subscriptionId);
      return true;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }
}
