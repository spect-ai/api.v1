import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdateCollectionCommand } from 'src/collection/commands';
import { Collection } from 'src/collection/model/collection.model';
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
    this.logger.setContext('VRFConsumerListener');
    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_POLYGON,
        Network.MATIC_MAINNET,
        '0xa80ed1Bfa30a8461aCa4830A240a10a355A547C8',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log, '137');
      });
    }
    // if (process.env.ALCHEMY_API_KEY_MUMBAI) {
    //   const { filterResponse, alchemy } = this.getWS(
    //     process.env.ALCHEMY_API_KEY_MUMBAI,
    //     Network.MATIC_MUMBAI,
    //     '0x3002C606938fab7c6Ce34EF4085392b4408a1c6e',
    //   );
    //   alchemy.ws.on(filterResponse, (log) => {
    //     this.decodeTransactionAndRecord(log, '80001');
    //   });
    // }
    if (process.env.ALCHEMY_API_KEY_GOERLI) {
      const { filterResponse, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_GOERLI,
        Network.ETH_GOERLI,
        '0x9796deb406fd76e9634069c50f2bdc51064eaf6e',
      );
      alchemy.ws.on(filterResponse, (log) => {
        this.decodeTransactionAndRecord(log, '5');
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
      topics: [utils.id('RequestFulfilled(uint256,uint256,uint256[],uint256)')],
    };
    return { filterResponse, alchemy };
  }

  private async decodeTransactionAndRecord(log: any, chainId: string) {
    try {
      if (
        log.topics[0] ===
        utils.id('RequestFulfilled(uint256,uint256,uint256[],uint256)')
      ) {
        const decodedEvents = this.iface.decodeEventLog(
          'RequestFulfilled',
          log.data,
          log.topics,
        );
        const surveyId = decodedEvents[0];

        const registry = await this.registryService.getRegistry();
        const provider = new ethers.providers.JsonRpcProvider(
          registry[chainId].provider,
        );
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

        const surveyProtocol = new ethers.Contract(
          registry[chainId].surveyHubAddress,
          surveyHubAbi,
          signer,
        );

        const lotteryWinner = await surveyProtocol.findLotteryWinner(surveyId);

        const user = await this.queryBus.execute(
          new GetProfileQuery(
            {
              ethAddress: lotteryWinner.toLowerCase(),
            },
            'bot',
            true,
          ),
        );
        if (user?.email) {
          try {
            const collection = await this.queryBus.execute(
              new GetCollectionByFilterQuery({
                'formMetadata.surveyTokenId': parseInt(surveyId),
                'formMetadata.surveyChain.value': chainId.toString(),
              }),
            );
            if (!collection) {
              throw `Collection not found for surveyId ${surveyId}`;
            }
            const html = this.emailGeneratorService.generateEmailWithMessage(
              `You have been picked as the lottery winner for filling out ${collection.name} survey`,
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
      this.logger.error(e);
    }
  }
}
