import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { GetCollectionByFilterQuery } from 'src/collection/queries';
import { LoggingService } from 'src/logging/logging.service';
import { MailService } from 'src/mail/mail.service';
import { EmailGeneratorService } from 'src/notification/email-generatr.service';
import { RegistryService } from 'src/registry/registry.service';
import { GetProfileQuery, GetUserByFilterQuery } from 'src/users/queries/impl';
import { surveyHubAbi } from './abis/surveyHub';
import { vrfConsumerAbi } from './abis/vrfConsumer';

@Injectable()
export class VRFConsumerListener {
  private iface = new utils.Interface(vrfConsumerAbi);
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly registryService: RegistryService,
    private readonly logger: LoggingService,
    private readonly emailGeneratorService: EmailGeneratorService,
    private readonly emailService: MailService,
  ) {
    // Need to refactor update payment method before we can use this
    console.log('VRFConsumer Listener listening');
    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_POLYGON,
        Network.MATIC_MAINNET,
        '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log);
      });
    }
    if (process.env.ALCHEMY_API_KEY_MUMBAI) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_MUMBAI,
        Network.MATIC_MUMBAI,
        '0xA0ef79e2bB29385106b2278Fa22b6BCdA8882761',
      );
      alchemy.ws.on(filterResponse, (log) => {
        console.log({ log });
        console.log(utils.id('RequestFulfilled(uint256,uint256[],uint256)'));
        this.decodeTransactionAndRecord(log);
      });
    }
  }

  private getWS(key: string, network: Network, vrfConsumerAddress: string) {
    const settings = {
      apiKey: key,
      network: network,
    };
    const alchemy = new Alchemy(settings);
    // For some reason the filter is not working with mutliple topics
    const filterResponse = {
      address: vrfConsumerAddress,
      topics: [utils.id('RequestFulfilled(uint256,uint256[],uint256)')],
    };
    return { filterResponse, alchemy };
  }

  private async decodeTransactionAndRecord(log: any) {
    try {
      console.log({ log });
      if (
        log.topics[0] ===
        utils.id('RequestFulfilled(uint256,uint256[],uint256)')
      ) {
        const decodedEvents = this.iface.decodeEventLog(
          'RequestFulfilled',
          log.data,
          log.topics,
        );
        console.log({ decodedEvents });
        const requestId = decodedEvents[0].toString();
        const collection = await this.queryBus.execute(
          new GetCollectionByFilterQuery({
            'formMetadata.requestId': requestId,
          }),
        );

        const registry = await this.registryService.getRegistry();

        const provider = new ethers.providers.JsonRpcProvider(
          registry['80001'].provider,
        );
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        const surveyProtocol = new ethers.Contract(
          registry['80001'].surveyHubAddress,
          surveyHubAbi,
          signer,
        );

        const lotteryWinner = await surveyProtocol.findLotteryWinner(
          collection?.formMetadata?.surveyTokenId,
        );

        console.log({ lotteryWinner });
        await this.commandBus.execute(
          new UpdateCollectionCommand(
            {
              formMetadata: {
                ...collection.formMetadata,
                surveyLotteryWinner: lotteryWinner,
              },
            },
            'bot',
            collection._id.toString(),
          ),
        );

        const user = await this.queryBus.execute(
          new GetProfileQuery(
            {
              ethAddress: lotteryWinner,
            },
            'bot',
          ),
        );
        if (user?.email) {
          try {
            const html = this.emailGeneratorService.generateEmailWithMessage(
              `You have been picked as the winner of the lottery for filling out ${collection.name} survey`,
              `https://circles.spect.network/r/${collection.slug}`,
            );
            const mail = {
              to: `${user?.email}`,
              from: {
                name: 'Spect Notifications',
                email: process.env.NOTIFICATION_EMAIL,
              }, // Fill it with your validated email on SendGrid account
              html,
              subject: `You have a new notification from Spect`,
            };
            const res = await this.emailService.send(mail);
          } catch (err) {
            this.logger.error(err);
          }
        }
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
