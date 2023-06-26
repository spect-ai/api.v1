import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { LoggingService } from 'src/logging/logging.service';
import { GetReferralCodeCommand } from '../impl/get-referralCode.command';
import { v4 as uuidv4 } from 'uuid';

@CommandHandler(GetReferralCodeCommand)
export class GetReferralCodeCommandHandler
  implements ICommandHandler<GetReferralCodeCommand>
{
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('AddItemCommandHandler');
  }

  async execute(command: GetReferralCodeCommand): Promise<string> {
    try {
      console.log('Get referral code command handler');
      const { user } = command;
      if (user.referralCode) {
        return user.referralCode;
      }

      const referralCode = uuidv4();
      const updateObj = {
        referralCode,
      };

      await this.userRepository.updateById(user.id, updateObj);
      return referralCode;
    } catch (error) {
      this.logger.error(
        `Failed generating referral code: ${error.message}`,
        command,
      );
    }
  }
}
