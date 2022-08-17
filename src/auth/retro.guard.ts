import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { RetroRepository } from 'src/retro/retro.repository';
import { User } from 'src/users/model/users.model';
import { CircleAuthGuard } from './circle.guard';
import { SessionAuthGuard } from './iron-session.guard';

@Injectable()
export class RetroAuthGuard implements CanActivate {
  constructor(
    private readonly retroRepository: RetroRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circlesService: CirclesService,
    private readonly reflector: Reflector,
  ) {}

  async checkPermissions(
    permissions: string[],
    userId: string,
    circleId: string,
  ): Promise<boolean> {
    if (permissions.length === 0) return true;
    const collatedUserPermissions =
      await this.circlesService.getCollatedUserPermissions([circleId], userId);
    console.log(collatedUserPermissions);
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
      console.log(request.user);
      if (!request.user) return false;

      const retro = await this.retroRepository.findById(request.params.id);
      if (!retro) {
        throw new HttpException('Retro not found', 404);
      }
      request.retro = retro;

      return await this.checkPermissions(
        permissions,
        request.user.id,
        retro.circle,
      );
    } catch (error) {
      console.log(error);
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CreateNewRetroAuthGuard implements CanActivate {
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
      const circle = await this.circlesRepository.findById(request.body.circle);
      if (!circle) {
        throw new HttpException('Circle not found', 404);
      }
      request.circle = circle;

      return this.circleAuthGuard.checkPermissions(
        ['createNewRetro'],
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
