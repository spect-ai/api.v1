import { Injectable } from '@nestjs/common';
import { Circle } from 'src/circle/model/circle.model';
import { DiscordService } from 'src/common/discord.service';
import { CirclePermission, Roles } from 'src/common/types/role.type';
import { User } from 'src/users/model/users.model';

@Injectable()
export class RolesService {
  constructor(private readonly discordService: DiscordService) {}

  defaultCircleRoles(): Roles {
    return {
      steward: {
        name: 'steward',
        description: 'Steward role',
        selfAssignable: false,
        permissions: {
          createNewCircle: true,
          manageCircleSettings: true,
          createNewProject: true,
          manageProjectSettings: true,
          createNewRetro: true,
          endRetroManually: true,
          managePaymentOptions: true,
          makePayment: true,
          inviteMembers: true,
          manageRoles: true,
          manageMembers: true,
          manageCardProperties: {
            Task: true,
            Bounty: true,
          },
          createNewCard: {
            Task: true,
            Bounty: true,
          },
          manageRewards: {
            Task: true,
            Bounty: true,
          },
          reviewWork: {
            Task: true,
            Bounty: true,
          },
          canClaim: {
            Task: true,
            Bounty: false,
          },
        } as CirclePermission,
      },
      contributor: {
        name: 'contributor',
        description: 'Contributor role',
        selfAssignable: false,
        permissions: {
          createNewCircle: false,
          manageCircleSettings: false,
          createNewProject: true,
          manageProjectSettings: true,
          createNewRetro: true,
          endRetroManually: false,
          managePaymentOptions: false,
          makePayment: true,
          inviteMembers: true,
          manageRoles: false,
          manageMembers: false,
          manageCardProperties: {
            Task: true,
            Bounty: false,
          },
          createNewCard: {
            Task: true,
            Bounty: false,
          },
          manageRewards: {
            Task: true,
            Bounty: false,
          },
          reviewWork: {
            Task: true,
            Bounty: false,
          },
          canClaim: {
            Task: true,
            Bounty: false,
          },
        } as CirclePermission,
      },
      member: {
        name: 'member',
        description: 'Member role',
        selfAssignable: false,
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
      /** TODO: We need to reserve this keyword and not let users set this as role */
      visitor: {
        name: 'visitor',
        description: 'Visitor role',
        selfAssignable: false,
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
    } as Roles;
  }

  getDefaultUserRoleOnCircleCreation(): string {
    return 'steward';
  }

  hasAccess(user: User, actions: string[], circle: Circle) {
    const memberRoles = circle.memberRoles[user.id];
    const circleRoles = circle.roles;

    // for (const action of actions) {
    //     for (const memberRole of memberRoles){
    //         if (!circleRoles[memberRole][action]) return false;
    //     }
    // }
    return true;
  }

  async getSpectRoleFromDiscord(user: User, circle: Circle): Promise<string[]> {
    const discordRole = await this.discordService.getDiscordRole(
      user.discordId,
      circle.discordGuildId,
    );
    const discordToCircleRoles = circle.discordToCircleRoles;
    if (!discordToCircleRoles)
      throw new Error('Discord to circle role mapping not setup');
    const activeRoles = [];
    for (const role of discordRole) {
      if (discordToCircleRoles[role]) {
        activeRoles.push(...discordToCircleRoles[role].circleRole);
      }
    }
    if (activeRoles.length === 0) {
      throw new Error('No roles found for user');
    }
    return [...new Set(activeRoles)];
  }

  collatePermissions(permissions: CirclePermission[]): CirclePermission {
    const permissionsCollated = {} as CirclePermission;
    for (const permission of permissions) {
      for (const [key, value] of Object.entries(permission)) {
        if (
          [
            'createNewCard',
            'manageRewards',
            'reviewWork',
            'canClaim',
            'manageCardProperties',
          ].includes(key)
        ) {
          for (const [cardType, val] of Object.entries(value)) {
            if (!permissionsCollated.hasOwnProperty(key)) {
              permissionsCollated[key] = {};
            }
            if (!permissionsCollated[key][cardType]) {
              permissionsCollated[key][cardType] = val;
            } else {
              permissionsCollated[key][cardType] =
                val || permissionsCollated[key][cardType];
            }
          }
        } else {
          if (!permissionsCollated[key]) {
            permissionsCollated[key] = value;
          } else {
            permissionsCollated[key] = permissionsCollated[key] || value;
          }
        }
      }
    }
    return permissionsCollated;
  }
}
