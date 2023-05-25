import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CirclesRepository } from 'src/circle/circles.repository';
import { Circle } from 'src/circle/model/circle.model';
import { RolesService } from 'src/roles/roles.service';
import { User } from 'src/users/model/users.model';
import { SessionAuthGuard } from './iron-session.guard';
import { UsersRepository } from 'src/users/users.repository';
import { KeysRepository } from 'src/users/keys.repository';

@Injectable()
export class CircleAuthGuard implements CanActivate {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly roleService: RolesService,
    private readonly reflector: Reflector,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly keysRepository: KeysRepository,
    private readonly usersRepository: UsersRepository,
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
      if (request.session.siwe?.address) {
        request.user = (await this.sessionAuthGuard.validateUser(
          request.session.siwe?.address,
        )) as unknown as User;
        if (!request.user) return false;
        if (!permissions) return true;
      } else if (request.headers.apiKey) {
        const keyData = await this.keysRepository.findOne({
          key: request.headers.apiKey,
        });
        if (!keyData?.userId) return false;
        request.user = await this.usersRepository.findById(keyData.userId);
      } else return false;
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
      // request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CreateCircleAuthGuard implements CanActivate {
  constructor(
    private readonly keysRepository: KeysRepository,
    private readonly usersRepository: UsersRepository,
    private readonly circlesRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circleAuthGuard: CircleAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      if (request.session.siwe?.address) {
        request.user = (await this.sessionAuthGuard.validateUser(
          request.session.siwe?.address,
        )) as unknown as User;
        if (!request.user) return false;
      } else if (request.headers.apiKey) {
        const keyData = await this.keysRepository.findOne({
          key: request.headers.apiKey,
        });
        if (!keyData?.userId) return false;
        request.user = await this.usersRepository.findById(keyData.userId);
      } else return false;

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
      // request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class ViewCircleAuthGuard implements CanActivate {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      // let circle;
      // if (request.params.id)
      //   circle = await this.circlesRepository.findById(request.params.id);
      // else if (request.params.slug)
      //   circle = await this.circlesRepository.findOne({
      //     slug: request.params.slug,
      //   });
      // if (!circle) {
      //   throw new HttpException('Circle not found', 404);
      // }
      // request.user = (await this.sessionAuthGuard.validateUser(
      //   request.session.siwe?.address,
      // )) as unknown as User;
      // if (circle.private) {
      //   if (!request.user || !circle.members.includes(request.user.id))
      //     return false;
      // }
      console.log({ headers: request.headers });
      if (!request.headers['x-api-key']) return false;

      return true;
    } catch (error) {
      console.log(error);
      // request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
