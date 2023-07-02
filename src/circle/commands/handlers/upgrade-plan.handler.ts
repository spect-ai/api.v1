import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { UpgradePlanCommand } from '../impl/upgrade-plan.command';
import Stripe from 'stripe';
import { UsersRepository } from 'src/users/users.repository';

@CommandHandler(UpgradePlanCommand)
export class UpgradePlanCommandHandler
  implements ICommandHandler<UpgradePlanCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: UpgradePlanCommand) {
    try {
      const {
        caller,
        id,
        upgradePlanDto: { memberTopUp, refCode },
      } = command;

      if (refCode === caller.referralCode) {
        throw new InternalServerErrorException(
          'You cannot use your own referral code',
        );
      }

      if (refCode) {
        const referredUser = await this.usersRepository.findOne({
          referralCode: refCode,
        });
        if (!referredUser)
          throw new InternalServerErrorException('Invalid referral code');

        await this.circlesRepository.updateCircleAndReturnWithPopulatedReferences(
          id,
          {
            referredBy: refCode,
          },
        );
      }

      const circle = await this.circlesRepository.findById(id);

      const circleRefCode = circle.referredBy;

      const stripe = new Stripe(process.env.STRIPE_PVT_KEY, {
        apiVersion: '2022-11-15',
      });
      const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
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
          quantity: memberTopUp,
        },
      ];
      if (!memberTopUp) {
        line_items.pop();
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'paypal', 'us_bank_account'],
        line_items,
        client_reference_id: id,
        mode: 'subscription',
        success_url: `${process.env.CLIENT_URL}/${circle.slug}`,
        cancel_url: `${process.env.CLIENT_URL}/${circle.slug}`,
        discounts:
          refCode || circleRefCode
            ? [
                {
                  coupon: process.env.STRIPE_DISCOUNT_CODE,
                },
              ]
            : [],
      });

      return {
        url: session.url,
      };
    } catch (error) {
      console.log({ error });
      throw error;
    }
  }
}
