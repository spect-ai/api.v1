import { Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { utils } from 'ethers';
import { UpdatePaymentCommand } from 'src/card/commands/impl';
import { CardCommandHandler } from 'src/card/handlers/update.command.handler';

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

  constructor(private readonly commandBus: CommandBus) {
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
        this.decodeTransactionAndRecord(log);
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
        this.decodeTransactionAndRecord(log);
      });
    }
  }

  private decodeTransactionAndRecord(log: any) {
    const decodedEvents = this.iface.decodeEventLog(
      'ethDistributed',
      log.data,
      log.topics,
    );
    console.log(decodedEvents);

    const cardIds = decodedEvents[1].split(',');
    const transactionHash = log.transactionHash;
    this.commandBus.execute(
      new UpdatePaymentCommand({
        cardIds,
        transactionHash,
      }),
    );
  }
}
