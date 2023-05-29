import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { UpgradePlanCommand } from '../impl/upgrade-plan.command';
import Stripe from 'stripe';

@CommandHandler(UpgradePlanCommand)
export class UpgradePlanCommandHandler
  implements ICommandHandler<UpgradePlanCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: UpgradePlanCommand) {
    try {
      const { id, upgradePlanDto } = command;
      const circle = await this.circlesRepository.findById(id);
      const stripe = new Stripe(process.env.STRIPE_PVT_KEY, {
        apiVersion: '2022-11-15',
      });
      const line_items: any[] = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Spect premium plan',
            },
            unit_amount: 3000,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Members top up',
            },
            unit_amount: 1000,
            recurring: {
              interval: 'month',
            },
          },
          quantity: upgradePlanDto.memberTopUp,
        },
      ];
      if (!upgradePlanDto.memberTopUp) {
        line_items.pop();
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        client_reference_id: id,
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/${circle.slug}`,
        cancel_url: `${process.env.CLIENT_URL}/${circle.slug}`,
      });
      return {
        url: session.url,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
