import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActionService } from 'src/card/actions.service';
import { CardsRepository } from 'src/card/cards.repository';
import { UpdateCardRequestDto } from 'src/card/dto/update-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { CirclesService } from 'src/circle/circles.service';
import { CirclePermission } from 'src/common/types/role.type';
import { ProjectsRepository } from 'src/project/project.repository';
import { User } from 'src/users/model/users.model';
import { UsersRepository } from 'src/users/users.repository';
import { SessionAuthGuard } from './iron-session.guard';
import { ProjectAuthGuard, ViewProjectAuthGuard } from './project.guard';

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

@Injectable()
export class CreateGithubPRAuthGuard implements CanActivate {
  constructor(
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly projectAuthGuard: ProjectAuthGuard,
    private readonly userRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const githubId = request.body.githubId;
      request.user = await this.userRepository.findOne({
        githubId: githubId,
      });

      if (!request.user) return false;
      return true;
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class ViewCardAuthGuard implements CanActivate {
  constructor(
    private readonly viewProjectAuthGuard: ViewProjectAuthGuard,
    private readonly cardsRepository: CardsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      let card;
      if (request.params.id)
        card = await this.cardsRepository.findById(request.params.id);
      else if (request.params.slug || request.params.cardSlug)
        card = await this.cardsRepository.findOne({
          slug: request.params.slug || request.params.cardSlug,
        });
      if (!card) {
        throw new HttpException('Card not found', 404);
      }
      request.card = card;
      request.projectId = card.project;
      console.log(request.projectId);
      return await this.viewProjectAuthGuard.canActivate(context);
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
