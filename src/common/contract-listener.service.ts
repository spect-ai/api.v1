import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { utils } from 'ethers';
import { AbiCoder } from 'ethers/lib/utils';
import { UpdatePaymentCommand } from 'src/card/commands/impl';
import { CardCommandHandler } from 'src/card/handlers/update.command.handler';
import { GetCardByIdQuery } from 'src/card/queries/impl';
import {
  GetCircleByFilterQuery,
  GetCircleByIdQuery,
} from 'src/circle/queries/impl';

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
];

@Injectable()
export class ContractListener {
  private iface = new utils.Interface(abi);
  private decoder = new AbiCoder();

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    // Need to refactor update payment method before we can use this
    console.log('Listener listening');
    if (process.env.ALCHEMY_API_KEY_MUMBAI) {
      const mumbaiSettings = {
        apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
        network: Network.MATIC_MUMBAI,
      };
      const alchemy = new Alchemy(mumbaiSettings);
      const filter = {
        address: '0xDcD240F9626581c96CDd40f6A710E439E0De7E2c',
        topics: [utils.id('ethDistributed(address,string)')],
      };
      alchemy.ws.on(filter, (log) => {
        console.log(log);
        this.decodeTransactionAndRecord(log, '80001');
      });
    }
    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const polygonSettings = {
        apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
        network: Network.MATIC_MAINNET,
      };
      const alchemy = new Alchemy(polygonSettings);
      const filter = {
        address: '0xB8352eb1A4C93EDA96eB4faEBe1aAF5ad8fBa06f',
        topics: [utils.id('ethDistributed(address,string)')],
      };
      alchemy.ws.on(filter, (log) => {
        console.log(log);
        this.decodeTransactionAndRecord(log, '137');
      });
    }
    if (process.env.ALCHEMY_API_KEY_GOERLI) {
      const polygonSettings = {
        apiKey: process.env.ALCHEMY_API_KEY_GOERLI,
        network: Network.ETH_GOERLI,
      };
      const alchemy = new Alchemy(polygonSettings);
      const filter = {
        address: '0xE3a3cAc7c493DBe3A43DaF8828Db2B66bdF520C3',
        topics: [utils.id('ethDistributed(address,string)')],
      };
      alchemy.ws.on(filter, (log) => {
        console.log(log);
        this.decodeTransactionAndRecord(log, '420');
      });
    }
    if (process.env.ALCHEMY_API_KEY_RINKEBY) {
      const polygonSettings = {
        apiKey: process.env.ALCHEMY_API_KEY_RINKEBY,
        network: Network.ETH_RINKEBY,
      };
      const alchemy = new Alchemy(polygonSettings);
      const filter = {
        address: '0x994DF14AbaDB671f35B89299FC983A478C6b907e',
        topics: [utils.id('ethDistributed(address,string)')],
      };
      alchemy.ws.on(filter, (log) => {
        console.log(log);
        this.decodeTransactionAndRecord(log, '4');
      });
    }
  }

  private async decodeTransactionAndRecord(log: any, chainId: string) {
    const decodedEvents = this.iface.decodeEventLog(
      'ethDistributed',
      log.data,
      log.topics,
    );

    const d = this.decoder.decode(
      ['string', 'string', 'string', 'string[]'],
      decodedEvents[1],
    );

    const transactionHash = log.transactionHash;
    const sender = decodedEvents[0];
    const caller = d[0];
    const circleId = d[1];
    const type = d[2];
    const ids = d[3];
    const circle = await this.queryBus.execute(
      new GetCircleByIdQuery(circleId),
    );
    console.log(ids, circleId, type, caller);
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
      }
    }
  }
}
