import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdatePaymentCommand } from 'src/card/commands/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { UpdateRetroCommand } from 'src/retro/commands/impl';

const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      { indexed: false, internalType: 'string', name: 'id', type: 'string' },
    ],
    name: 'ethDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'id',
        type: 'string',
      },
    ],
    name: 'tokenDistributed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'id',
        type: 'string',
      },
    ],
    name: 'tokensDistributed',
    type: 'event',
  },
];

@Injectable()
export class ContractListener {
  private iface = new utils.Interface(abi);
  private decoder = new AbiCoder();

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    // Need to refactor update payment method before we can use this
    console.log('Listener listening');
    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const { filterEth, filterTokens, filterToken, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_POLYGON,
        Network.MATIC_MAINNET,
        '0xB8352eb1A4C93EDA96eB4faEBe1aAF5ad8fBa06f',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '137');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '137');
      });
    }
    if (process.env.ALCHEMY_API_KEY_RINKEBY) {
      const { filterEth, filterTokens, filterToken, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_RINKEBY,
        Network.ETH_RINKEBY,
        '0x994DF14AbaDB671f35B89299FC983A478C6b907e',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '4');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '4');
      });
    }
    if (process.env.ALCHEMY_API_KEY_OPTIMISM) {
      const { filterEth, filterTokens, filterToken, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_OPTIMISM,
        Network.OPT_MAINNET,
        '0xD620b76e0dE2A776449E2969Bf8B725ECDA5b66e',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '10');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '10');
      });
    }
    if (process.env.ALCHEMY_API_KEY_ARBITRUM) {
      const { filterEth, filterTokens, filterToken, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_ARBITRUM,
        Network.ARB_MAINNET,
        '0xE3a3cAc7c493DBe3A43DaF8828Db2B66bdF520C3',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '42161');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '42161');
      });
    }
    if (process.env.ALCHEMY_API_KEY_MAINNET) {
      const { filterEth, filterTokens, filterToken, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_MAINNET,
        Network.ETH_MAINNET,
        '0xD620b76e0dE2A776449E2969Bf8B725ECDA5b66e',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '1');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '1');
      });
    }
  }

  private getWS(key: string, network: Network, distributorAddress: string) {
    const settings = {
      apiKey: key,
      network: network,
    };
    const alchemy = new Alchemy(settings);
    // For some reason the filter is not working with mutliple topics
    const filterEth = {
      address: distributorAddress,
      topics: [utils.id('ethDistributed(address,string)')],
    };
    const filterTokens = {
      address: distributorAddress,
      topics: [utils.id('tokensDistributed(address,string)')],
    };
    const filterToken = {
      address: distributorAddress,
      topics: [utils.id('tokenDistributed(address,address,string)')],
    };
    return { filterEth, filterTokens, filterToken, alchemy };
  }

  private async decodeTransactionAndRecord(log: any, chainId: string) {
    try {
      let decodedEvents;
      if (log.topics[0] === utils.id('ethDistributed(address,string)')) {
        decodedEvents = this.iface.decodeEventLog(
          'ethDistributed',
          log.data,
          log.topics,
        );
      }
      if (log.topics[0] === utils.id('tokensDistributed(address,string)')) {
        decodedEvents = this.iface.decodeEventLog(
          'tokensDistributed',
          log.data,
          log.topics,
        );
      }
      console.log(decodedEvents);
      const d = this.decoder.decode(
        ['string', 'string', 'string', 'string[]'],
        decodedEvents[1],
      );

      const transactionHash = log.transactionHash as string;
      const sender = decodedEvents[0];
      const caller = d[0];
      const circleId = d[1];
      const type = d[2];
      const ids = d[3];
      const circle = await this.queryBus.execute(
        new GetCircleByIdQuery(circleId),
      );
      if (
        circle.safeAddresses &&
        circle.safeAddresses[chainId] &&
        circle.safeAddresses[chainId].includes(sender)
      ) {
        if (type === 'card') {
          console.log('Updating card');
          this.commandBus.execute(
            new UpdatePaymentCommand(
              {
                cardIds: ids,
                transactionHash,
              },
              caller,
            ),
          );
        } else if (type === 'retro') {
          if (ids.length > 0) {
            console.log('Updating retro');
            this.commandBus.execute(
              new UpdateRetroCommand(ids[0], {
                reward: {
                  transactionHash,
                },
                status: {
                  active: false,
                  paid: true,
                },
              }),
            );
          }
        }
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
