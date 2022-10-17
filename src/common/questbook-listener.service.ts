import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers, utils, BigNumber } from 'ethers';
import { LoggingService } from 'src/logging/logging.service';
import fetch from 'node-fetch';
import {
  AddRoleCommand,
  CreateClaimableCircleCommand,
} from 'src/circle/commands/impl';
import { qbApplicationRegistryAbi } from './abis/questbookApplicationRegistry';
import { GetCircleByFilterQuery } from 'src/circle/queries/impl';
import { Circle } from 'src/circle/model/circle.model';
import { CirclePermission } from './types/role.type';
import { WhitelistMemberAddressCommand } from 'src/circle/commands/roles/impl/whitelist-member-address.command';
import { CreateCardCommand } from 'src/card/commands/impl';
import { GetProjectByIdQuery } from 'src/project/queries/impl';
import { DiscordService } from './discord.service';
import { CreateProjectCommand } from 'src/project/commands/impl';

@Injectable()
export class QuestbookListener {
  private iface = new utils.Interface(qbApplicationRegistryAbi);
  private optimismProvider;
  private polygonProvider;
  private questbookApplicationContractOnOptimism;
  private questbookApplicationContractOnPolygon;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly discordService: DiscordService,
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

      const signer = new ethers.Wallet(
        process.env.PRIVATE_KEY,
        this.polygonProvider,
      );

      this.questbookApplicationContractOnPolygon = new ethers.Contract(
        '0xE9d6c045232b7f4C07C151f368E747EBE46209E4',
        qbApplicationRegistryAbi,
        signer,
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
        if (
          decodedEvents[3] &&
          BigNumber.from(decodedEvents[3]).toNumber() === 2
        ) {
          let application;
          if (chainId === '10')
            application =
              await this.questbookApplicationContractOnOptimism.applications(
                BigNumber.from(decodedEvents[0]),
              );
          else if (chainId === '137')
            application =
              await this.questbookApplicationContractOnPolygon.applications(
                BigNumber.from(decodedEvents[0]),
              );
          if (!application) return null;

          const applicationMetadata = await this.fetchMetadataFromIPFS(
            application.metadataHash,
          );

          const parsedApplication =
            this.parseApplicationMetadata(applicationMetadata);
          const parentCircle = await this.getParentCircle(application);
          if (parentCircle) {
            const granteeCircle = await this.createGranteeCircle(
              parsedApplication,
              parentCircle,
            );
            await this.addGranteeToParentCircle(
              parentCircle,
              parsedApplication.applicantAddress,
            );

            await this.addGranteeToGranteeProject(
              parentCircle,
              granteeCircle,
              parsedApplication,
            );
            await this.createMilestone(
              parentCircle,
              granteeCircle,
              parsedApplication,
            );

            if (granteeCircle) await this.notify(parentCircle, granteeCircle);
          }
        }
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  private async getParentCircle(application: any) {
    if (!application.workspaceId) return null;
    const circle = await this.queryBus.execute(
      new GetCircleByFilterQuery({
        questbookWorkspaceId: application.workspaceId?.toHexString(),
      }),
    );
    if (!circle) return null;

    return circle;
  }

  private parseApplicationMetadata(applicationMetadata: any): any {
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
    res['milestones'] = applicationMetadata['milestones'] || [];

    return res;
  }

  private async fetchMetadataFromIPFS(metadataHash: string) {
    const encodedString = Buffer.from(
      process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET,
    ).toString('base64');
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

  private async createGranteeCircle(
    parsedApplication: any,
    parentCircle: Circle,
  ): Promise<Circle> {
    const granteeCircle = await this.commandBus.execute(
      new CreateClaimableCircleCommand({
        name: parsedApplication.projectName,
        qualifiedClaimee: [parsedApplication.applicantAddress],
        parent: parentCircle.id,
      }),
    );
    try {
      await this.commandBus.execute(
        new CreateProjectCommand({
          name: `${parentCircle.name} Grant`,
          circleId: granteeCircle.id,
          fromTemplateId: '6316cfe0013982438514cc7a', // TODO: Remove hardcoded value
        }),
      );
    } catch (err) {
      this.logger.error(
        `Failed creating grantee project wih error ${err.message}`,
      );
    }

    // await this.commandBus.execute;
    return granteeCircle;
  }

  private async addGranteeToParentCircle(
    circle: Circle,
    applicantAddress: string,
  ) {
    if (!circle.roles || !circle.roles['grantee']) {
      this.commandBus
        .execute(
          new AddRoleCommand(
            {
              name: 'Grantee',
              description: 'Grantees of the circle',
              selfAssignable: false,
              mutable: false,
              permissions: {
                createNewCircle: false,
                manageCircleSettings: false,
                createNewProject: false,
                manageProjectSettings: false,
                createNewRetro: false,
                endRetroManually: false,
                managePaymentOptions: false,
                makePayment: false,
                inviteMembers: false,
                manageRoles: false,
                manageMembers: false,
                distributeCredentials: false,
                manageCardProperties: {
                  Task: false,
                  Bounty: false,
                },
                createNewCard: {
                  Task: false,
                  Bounty: false,
                },
                manageRewards: {
                  Task: false,
                  Bounty: false,
                },
                reviewWork: {
                  Task: false,
                  Bounty: false,
                },
                canClaim: {
                  Task: false,
                  Bounty: false,
                },
              } as CirclePermission,
            },
            circle,
          ),
        )
        .then((res) => {
          console.log(res);
          this.commandBus.execute(
            new WhitelistMemberAddressCommand(
              applicantAddress?.toLowerCase(),
              ['grantee'],
              circle,
            ),
          );
        });
    } else {
      await this.commandBus.execute(
        new WhitelistMemberAddressCommand(
          applicantAddress?.toLowerCase(),
          ['grantee'],
          circle,
        ),
      );
    }
  }

  private async createMilestone(
    circle: Circle,
    grantCircle: Circle,
    application: any,
  ) {
    if (circle.grantApplicantProject) {
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(circle.grantMilestoneProject),
      );
      if (!(project.columnOrder.length > 0)) return;
      if (application.milestones) {
        for (const milestone of application.milestones) {
          await this.commandBus.execute(
            new CreateCardCommand(
              {
                title: `${application.projectName} - ${milestone.title}`,
                project: circle.grantMilestoneProject,
                circle: circle.id,
                type: 'Task',
                columnId: project.columnOrder[0],
                reward: {
                  ...circle.defaultPayment,
                  value: milestone.amount,
                },
                assignedCircle: grantCircle.id,
              },
              project,
              circle,
              null,
            ),
          );
        }
      }
    }
  }

  private async addGranteeToGranteeProject(
    circle: Circle,
    grantCircle: Circle,
    application: any,
  ) {
    if (circle.grantApplicantProject) {
      const project = await this.queryBus.execute(
        new GetProjectByIdQuery(circle.grantApplicantProject),
      );
      if (!(project.columnOrder.length > 0)) return;
      const card = await this.commandBus.execute(
        new CreateCardCommand(
          {
            title: application.projectName,
            project: circle.grantApplicantProject,
            circle: circle.id,
            type: 'Task',
            columnId: project.columnOrder[0],
            assignedCircle: grantCircle.id,
          },
          project,
          circle,
          null,
        ),
      );
      return card;
    }
    return false;
  }

  private async notify(circle: Circle, granteeCircle: Circle) {
    if (circle.discordGuildId && circle.grantNotificationChannel) {
      const res = await this.discordService.postNotificationOnNewCircle(
        granteeCircle,
        [circle.grantNotificationChannel],
        circle.discordGuildId,
        `https://circles.spect.network/${granteeCircle.slug}`,
      );
      if (!res.ok) {
        this.logger.error(
          `Notifying grant application acceptance failed with response ${JSON.stringify(
            res,
          )}`,
        );
      }
    }
  }
}
