import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils, BigNumber } from 'ethers';
import { LoggingService } from 'src/logging/logging.service';
// import ipfsClient from 'ipfs-http-client';
import fetch from 'node-fetch';
import {
  CreateCircleCommand,
  CreateClaimableCircleCommand,
} from 'src/circle/commands/impl';
import { qbApplicationRegistryAbi } from './abis/questbookApplicationRegistry';
import { qbWorkspaceRegistryAbi } from './abis/questbookWorkspaceRegistry';
import { GetCircleByFilterQuery } from 'src/circle/queries/impl';

@Injectable()
export class QuestbookListener {
  private iface = new utils.Interface(qbApplicationRegistryAbi);
  private optimismProvider;
  private polygonProvider;
  private questbookApplicationContractOnOptimism;
  private questbookWorkspaceContractOnOptimism;
  private questbookApplicationContractOnPolygon;
  private questbookWorkspaceContractOnPolygon;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
  ) {
    console.log('Questbook listener');

    if (process.env.ALCHEMY_API_KEY_POLYGON) {
      const { applicationStateChanged, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_POLYGON,
        Network.MATIC_MAINNET,
        '0xE9d6c045232b7f4C07C151f368E747EBE46209E4',
      );
      alchemy.ws.on(applicationStateChanged, (log) => {
        this.processApplicationUpdate(log, '137');
      });
      this.polygonProvider = new ethers.providers.AlchemyProvider(
        'matic',
        process.env.ALCHEMY_API_KEY_POLYGON,
      );
    }

    if (process.env.ALCHEMY_API_KEY_OPTIMISM) {
      const { applicationStateChanged, alchemy } = this.getWS(
        process.env.ALCHEMY_API_KEY_OPTIMISM,
        Network.OPT_MAINNET,
        '0xF4Db8BdDF1029764e4E09e7cE34149371a9A7027',
      );

      alchemy.ws.on(applicationStateChanged, (log) => {
        this.processApplicationUpdate(log, '10');
      });

      this.optimismProvider = new ethers.providers.AlchemyProvider(
        'optimism',
        process.env.ALCHEMY_API_KEY_OPTIMISM,
      );

      const signer = new ethers.Wallet(
        process.env.PRIVATE_KEY,
        this.optimismProvider,
      );

      this.questbookApplicationContractOnOptimism = new ethers.Contract(
        '0xF4Db8BdDF1029764e4E09e7cE34149371a9A7027',
        qbApplicationRegistryAbi,
        signer,
      );
      this.questbookWorkspaceContractOnOptimism = new ethers.Contract(
        '0x2dB223158288B2299480aF577eDF30D5a533F137',
        qbWorkspaceRegistryAbi,
        signer,
      );
    }
  }

  private getWS(key: string, network: Network, distributorAddress: string) {
    const settings = {
      apiKey: key,
      network: network,
    };
    const alchemy = new Alchemy(settings);
    // For some reason the filter is not working with mutliple topics
    const applicationStateChanged = {
      address: distributorAddress,
      topics: [
        utils.id(
          'ApplicationUpdated(uint96,address,string,uint8,uint48,uint256)',
        ),
      ],
    };
    return { applicationStateChanged, alchemy };
  }

  private async processApplicationUpdate(log: any, chainId: string) {
    try {
      let decodedEvents;
      if (
        log.topics[0] ===
        utils.id(
          'ApplicationUpdated(uint96,address,string,uint8,uint48,uint256)',
        )
      ) {
        decodedEvents = this.iface.decodeEventLog(
          'ApplicationUpdated',
          log.data,
          log.topics,
        );
        const applicationMetadata = await this.fetchMetadataFromIPFS(
          decodedEvents[2],
        );
        const parsedApplication =
          this.parseApplicationMetadata(applicationMetadata);
        console.log(parsedApplication);
        const parentCircle = await this.getParentCircle(decodedEvents[0]);
        console.log(parentCircle);
        if (parentCircle) {
          await this.commandBus.execute(
            new CreateClaimableCircleCommand({
              name: parsedApplication.projectName,
              description: parsedApplication.projectDetails,
              qualifiedClaimee: [parsedApplication.applicantAddress],
            }),
          );
        }
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private async getParentCircle(applicationId: number) {
    const application =
      await this.questbookApplicationContractOnOptimism.applications(
        BigNumber.from(applicationId),
      );
    console.log('application');
    console.log(application);

    if (!application) return null;
    const workspace =
      await this.questbookWorkspaceContractOnOptimism.workspaces(
        BigNumber.from(application.workspaceId),
      );
    console.log(workspace);
    if (!workspace) return null;
    const circle = await this.queryBus.execute(
      new GetCircleByFilterQuery({
        workspaceId: workspace.id,
      }),
    );
    if (!circle) return null;

    return circle;
  }

  private parseApplicationMetadata(applicationMetadata: any): any {
    console.log(applicationMetadata);
    const applicationFields = applicationMetadata.fields;
    const res = {};
    res['applicantName'] = applicationFields['applicantName'][0].value;
    res['applicantEmail'] =
      applicationFields['applicantEmail'] &&
      applicationFields['applicantEmail'].length > 0
        ? applicationFields['applicantEmail'][0].value
        : null;
    res['applicantAddress'] = applicationFields['applicantAddress'][0].value;
    res['projectName'] = applicationFields['projectName'][0].value;
    res['projectDetails'] = applicationFields['projectDetails'][0].value;
    res['projectLink'] =
      applicationFields['projectLink'] &&
      applicationFields['projectLink'].length > 0
        ? applicationFields['projectLink'][0].value
        : null;
    res['projectGoals'] =
      applicationFields['projectGoals'] &&
      applicationFields['projectGoals'].length > 0
        ? applicationFields['projectGoals'][0].value
        : null;
    res['milestones'] = applicationFields['milestones'] || [];

    return res;
  }

  private async fetchMetadataFromIPFS(metadataHash: string) {
    const projectId = '2E6toVcDcGO87J2tX6GHK4aBILR';
    const projectSecret = '9f96144517b0a20eef70c46239ab0ad7';
    const encodedString = Buffer.from(projectId + ':' + projectSecret).toString(
      'base64',
    );
    console.log(metadataHash);
    const res = await fetch(
      `https://ipfs.infura.io:5001/api/v0/cat?arg=${metadataHash}`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encodedString}`,
        },
        method: 'POST',
      },
    );
    if (res) {
      return await res.json();
    }
    return false;
  }
}
