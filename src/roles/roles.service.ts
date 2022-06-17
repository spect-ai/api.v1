import { Injectable } from '@nestjs/common';
import { Circle } from 'src/circle/model/circle.model';
import { DiscordService } from 'src/common/discord.service';
import { User } from 'src/users/model/users.model';

@Injectable()
export class RolesService {
  constructor(private readonly discordService: DiscordService) {}

  defaultCircleRoles() {
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
        },
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
        },
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
        },
      },
    };
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

  async getSpectRoleFromDiscord(user: User, circle: Circle): Promise<string> {
    const discordRole = await this.discordService.getDiscordRole(user.id);
    const discordToCircleRoles = circle.discordToCircleRoles;
    return discordToCircleRoles[discordRole];
  }
}
