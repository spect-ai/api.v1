import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { ProjectsRepository } from 'src/project/project.repository';
import { User } from 'src/users/model/users.model';
import { CircleAuthGuard } from './circle.guard';
import { SessionAuthGuard } from './iron-session.guard';

@Injectable()
export class ProjectAuthGuard implements CanActivate {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circlesService: CirclesService,
    private readonly reflector: Reflector,
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
    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
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
        permissions,
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
export class ViewProjectAuthGuard implements CanActivate {
  constructor(
    private readonly projectRepository: ProjectsRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circleAuthGuard: CircleAuthGuard,
  ) {}

  async isMember(circleIds: string[], userId: string) {
    const circles = await this.circleRepository.findAll({
      _id: { $in: circleIds },
    });
    for (const circle of circles) {
      if (circle.members.includes(userId)) return true;
    }
    return false;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      let project;
      if (request.params.id || request.projectId)
        project = await this.projectRepository.findById(
          request.params.id || request.projectId,
        );
      else if (request.params.slug)
        project = await this.projectRepository.findOne({
          slug: request.params.slug,
        });
      if (!project) {
        throw new HttpException('Project not found', 404);
      }
      request.project = project;
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (project.private) {
        if (!request.user) return false;

        return await this.isMember(project.parents, request.user.id);
      }

      return true;
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
