import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ObjectId } from 'mongoose';
import { ActionService } from 'src/card/actions.service';
import { CardsRepository } from 'src/card/cards.repository';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import {
  CreateWorkThreadRequestDto,
  CreateWorkUnitRequestDto,
  UpdateWorkThreadRequestDto,
  UpdateWorkUnitRequestDto,
} from 'src/card/dto/work-request.dto';
import { Card } from 'src/card/model/card.model';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { Circle } from 'src/circle/model/circle.model';
import { CirclePermission } from 'src/common/types/role.type';
import { ProjectsRepository } from 'src/project/project.repository';
import { RolesService } from 'src/roles/roles.service';
import { User } from 'src/users/model/users.model';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly ethAddressService: EthAddressService) {}

  async validateUser(address: string): Promise<ObjectId | boolean> {
    if (address) {
      const user = (
        await this.ethAddressService.findByAddress(address.toLowerCase())
      )?.user;
      if (!user) {
        throw new HttpException('User not found', 404);
      }
      return user;
    }
    return false;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = await this.validateUser(request.session.siwe?.address);
      if (!request.user) return false;
      return true;
    } catch (error) {
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class PublicViewAuthGuard implements CanActivate {
  constructor(private readonly sessionAuthGuard: SessionAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      );
      return true;
    } catch (error) {
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CircleAuthGuard implements CanActivate {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly roleService: RolesService,
    private readonly reflector: Reflector,
    private readonly sessionAuthGuard: SessionAuthGuard,
  ) {}

  checkPermissions(
    permissions: string[],
    userRoles: string[],
    circle: Circle,
  ): boolean {
    if (!userRoles) return false;
    if (permissions.length === 0) return true;
    const userPermissions = userRoles.map(
      (role) => circle.roles[role].permissions,
    );
    const collatedUserPermissions =
      this.roleService.collatePermissions(userPermissions);
    for (const permission of permissions) {
      if (!collatedUserPermissions[permission]) return false;
    }
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();
    try {
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (!request.user) return false;
      if (!permissions) return true;

      const circle = await this.circlesRepository.findById(request.params.id);
      if (!circle) {
        throw new HttpException('Circle not found', 404);
      }
      request.circle = circle;
      return this.checkPermissions(
        permissions,
        circle?.memberRoles[request.user.id] || [],
        circle,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CreateCircleAuthGuard implements CanActivate {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circleAuthGuard: CircleAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (!request.user) return false;
      if (!request.body.parent) return true;

      const circle = await this.circlesRepository.findById(request.body.parent);
      if (!circle) {
        throw new HttpException('Circle not found', 404);
      }

      return this.circleAuthGuard.checkPermissions(
        ['createNewCircle'],
        circle?.memberRoles[request.user.id] || [],
        circle,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class ProjectAuthGuard implements CanActivate {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circlesService: CirclesService,
  ) {}

  async checkPermissions(
    permissions: string[],
    userId: string,
    circleIds: string[],
  ): Promise<boolean> {
    if (permissions.length === 0) return true;
    const collatedUserPermissions =
      await this.circlesService.getCollatedUserPermissions(circleIds, userId);
    for (const permission of permissions) {
      if (!collatedUserPermissions[permission]) return false;
    }
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (!request.user) return false;

      const project = await this.projectRepository.findById(request.params.id);
      if (!project) {
        throw new HttpException('Project not found', 404);
      }
      request.project = project;

      return await this.checkPermissions(
        ['createNewCircle'],
        request.user.id,
        project.parents,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CreateNewProjectAuthGuard implements CanActivate {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circleAuthGuard: CircleAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (!request.user) return false;
      const circle = await this.circlesRepository.findById(
        request.body.circleId,
      );
      if (!circle) {
        throw new HttpException('Circle not found', 404);
      }
      request.circle = circle;

      return this.circleAuthGuard.checkPermissions(
        ['createNewProject'],
        circle?.memberRoles[request.user.id] || [],
        circle,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CardAuthGuard implements CanActivate {
  constructor(
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circlesService: CirclesService,
    private readonly projectRepository: ProjectsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly actionService: ActionService,
    private readonly reflector: Reflector,
  ) {}

  checkApplyPermissions(userId: string, card: Card): boolean {
    return this.actionService.canApply(card, userId).valid;
  }

  checkSubmitPermissions(
    userId: string,
    card: Card,
    collatedUserPermissions: CirclePermission,
    param?: any,
  ): boolean {
    const canSubmit =
      this.actionService.canSubmit(card, userId).valid ||
      this.actionService.canAddRevisionInstructions(
        card,
        collatedUserPermissions,
        userId,
      ).valid;

    if (!param.threadId || !param.workUnitId) return canSubmit;
    return (
      canSubmit &&
      /** Make sure if user is updating a work unit they have permission to do so */
      (!card.workThreads ||
        !card.workThreads.hasOwnProperty(param.threadId) ||
        !card.workThreads[param.threadId].workUnits.hasOwnProperty(
          param.workUnitId,
        ) ||
        card.workThreads[param.threadId]?.workUnits[param.workUnitId].user ===
          userId)
    );
  }

  checkUpdatePermissions(
    body: UpdateCardRequestDto,
    userId: string,
    card: Card,
    collatedUserPermissions: CirclePermission,
  ): boolean {
    if (
      body.hasOwnProperty('status') &&
      body.status.archived &&
      !this.actionService.canArchive(card, collatedUserPermissions, userId)
    ) {
      return false;
    }
    return this.actionService.canUpdateGeneralInfo(
      card,
      collatedUserPermissions,
      userId,
    ).valid;
  }

  async checkPermissions(
    permissions: string[],
    request: any,
    userId: string,
    card: Card,
    circleIds: string[],
  ): Promise<boolean> {
    const collatedUserPermissions =
      await this.circlesService.getCollatedUserPermissions(circleIds, userId);
    for (const permission of permissions) {
      if (permission === 'update')
        if (
          !this.checkUpdatePermissions(
            request.body,
            userId,
            card,
            collatedUserPermissions,
          )
        )
          return false;
      if (permission === 'submit')
        if (
          !this.checkSubmitPermissions(
            userId,
            card,
            collatedUserPermissions,
            request.params,
          )
        )
          return false;
      if (permission === 'apply')
        if (!this.checkApplyPermissions(userId, card)) return false;
    }
    return true;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    const request = context.switchToHttp().getRequest();
    try {
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (!request.user) return false;

      request.card = await this.cardsRepository.findById(request.params.id);
      if (!request.card) {
        throw new HttpException('Card not found', 404);
      }
      request.project = await this.projectRepository.findById(
        request.card.project,
      );
      if (!request.project) {
        throw new HttpException('Project not found', 404);
      }

      return await this.checkPermissions(
        permissions,
        request,
        request.user.id,
        request.card,
        request.project.parents,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CreateNewCardAuthGuard implements CanActivate {
  constructor(
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly projectAuthGuard: ProjectAuthGuard,
    private readonly projectRepository: ProjectsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (!request.user) return false;
      request.project = await this.projectRepository.findById(
        request.body.project,
      );
      if (!request.project) {
        throw new HttpException('Project not found', 404);
      }

      return this.projectAuthGuard.checkPermissions(
        ['createNewCard'],
        request.user.id,
        request.project.parents,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
