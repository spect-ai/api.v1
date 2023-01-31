import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdatePaymentCommand } from 'src/card/commands/impl';
import {
  UpdateMultiplePaymentsCommand,
  UpdatePaymentsCommand,
} from 'src/circle/commands/payments/impl';
import { GetCircleByIdQuery } from 'src/circle/queries/impl';
import { LoggingService } from 'src/logging/logging.service';
import { RealtimeGateway } from 'src/realtime/realtime.gateway';
import { UpdateRetroCommand } from 'src/retro/commands/impl';
import { distributorAbi } from './abis/distributor';

@Injectable()
export class ContractListener {
  private iface = new utils.Interface(distributorAbi);
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
        '0xD38028814eC0AAD592c97dE015B6F7ee5c019B48',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '137');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '137');
      });
    }
    if (process.env.ALCHEMY_API_KEY_MUMBAI) {
      const { filterEth, filterTokens, filterToken, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_MUMBAI,
        Network.MATIC_MUMBAI,
        '0x05588517bC463f607Dca0E09d1f73CDaa30cfF10',
      );
      alchemy.ws.on(filterEth, (log) => {
        this.decodeTransactionAndRecord(log, '80001');
      });
      alchemy.ws.on(filterTokens, (log) => {
        this.decodeTransactionAndRecord(log, '80001');
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
      console.log({ log });
      console.log({ id: utils.id('ethDistributed(address,string)') });
      if (log.topics[0] === utils.id('ethDistributed(address,string)')) {
        decodedEvents = this.iface.decodeEventLog(
          'ethDistributed',
          log.data,
          log.topics,
        );
      } else if (
        log.topics[0] === utils.id('tokensDistributed(address,string)')
      ) {
        decodedEvents = this.iface.decodeEventLog(
          'tokensDistributed',
          log.data,
          log.topics,
        );
      }
      console.log({ decodedEvents });
      const d = this.decoder.decode(
        ['string', 'string', 'string[]'],
        decodedEvents[1],
      );
      console.log({ d });

      const transactionHash = log.transactionHash as string;
      const sender = decodedEvents[0];
      const caller = d[0];
      const circleId = d[1];
      const ids = d[2];
      await this.commandBus.execute(
        new UpdateMultiplePaymentsCommand(
          circleId,
          ids,
          {
            paymentIds: ids,
            transactionHash,
            status: 'Completed',
          },
          caller,
        ),
      );
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
