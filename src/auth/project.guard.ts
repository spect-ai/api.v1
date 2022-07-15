import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
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
