import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CirclesRepository } from 'src/circle/circles.repository';
import { CirclesService } from 'src/circle/circles.service';
import { CollectionRepository } from 'src/collection/collection.repository';
import { Collection } from 'src/collection/model/collection.model';
import { User } from 'src/users/model/users.model';
import { CircleAuthGuard } from './circle.guard';
import { SessionAuthGuard } from './iron-session.guard';
import { KeysRepository } from 'src/users/keys.repository';
import { UsersRepository } from 'src/users/users.repository';

@Injectable()
export class CollectionAuthGuard implements CanActivate {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circlesService: CirclesService,
    private readonly reflector: Reflector,
  ) {}

  async checkPermissions(
    permissions: string[],
    userId: string,
    collection: Collection,
    circleIds: string[],
  ): Promise<boolean> {
    if (permissions.length === 0) return true;
    if (collection.creator === userId) return true;
    const userRoles = await this.circlesService.getUserRolesInCircle(
      circleIds,
      userId,
    );
    if (!userRoles) return false;
    for (const role of userRoles) {
      for (const permission of permissions) {
        if (collection.permissions[permission]?.includes(role)) {
          return true;
        }
      }
    }
    return false;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    try {
      if (!(await this.sessionAuthGuard.canActivate(context))) return false;

      const collection = await this.collectionRepository.findById(
        request.params.id,
      );
      if (!collection) {
        throw new HttpException('Collection not found', 404);
      }
      request.collection = collection;

      return await this.checkPermissions(
        permissions,
        request.user.id,
        collection,
        collection.parents,
      );
    } catch (error) {
      console.log(error);
      //   request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class CreateNewCollectionAuthGuard implements CanActivate {
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circleAuthGuard: CircleAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      if (!(await this.sessionAuthGuard.canActivate(context))) return false;

      const circle = await this.circlesRepository.findById(
        request.body.circleId,
      );
      if (!circle) {
        throw new HttpException('Circle not found', 404);
      }
      request.circle = circle;

      return this.circleAuthGuard.checkPermissions(
        ['createNewForm'],
        circle?.memberRoles[request.user.id] || [],
        circle,
      );
    } catch (error) {
      console.log(error);
      //   request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class ViewCollectionAuthGuard implements CanActivate {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly circleRepository: CirclesRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
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
      let collection;
      if (request.params.id || request.projectId)
        collection = await this.collectionRepository.findById(
          request.params.id || request.projectId,
        );
      else if (request.params.slug)
        collection = await this.collectionRepository.findOne({
          slug: request.params.slug,
        });
      if (!collection) {
        throw new HttpException('Collection not found', 404);
      }
      request.collection = collection;
      if (!(await this.sessionAuthGuard.canActivate(context))) return false;

      return await this.isMember(collection.parents, request.user.id);
    } catch (error) {
      console.log(error);
      // request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class StrongerCollectionAuthGuard implements CanActivate {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly sessionAuthGuard: SessionAuthGuard,
    private readonly circleRepository: CirclesRepository,
    private readonly reflector: Reflector,
  ) {}

  async checkPermissions(
    permissions: string[],
    userId: string,
    collection: Collection,
  ): Promise<boolean> {
    if (permissions.length === 0) return true;

    const circle = await this.circleRepository.findById(collection.parents[0]);
    const userRoles = circle?.memberRoles[userId];
    const permissionsSatisfied = [];
    for (const permission of permissions) {
      if (
        collection.permissions[permission]?.some((role) =>
          userRoles?.includes(role),
        )
      ) {
        permissionsSatisfied.push(true);
      } else permissionsSatisfied.push(false);
    }

    return permissionsSatisfied.every((permission) => permission === true);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    try {
      if (!(await this.sessionAuthGuard.canActivate(context))) return false;

      if (request.params.id || request.projectId)
        request.collection = await this.collectionRepository.findById(
          request.params.id || request.projectId,
        );
      else if (request.params.slug)
        request.collection = await this.collectionRepository.findOne({
          slug: request.params.slug,
        });
      if (!request.collection) {
        throw new HttpException('Collection not found', 404);
      }

      return await this.checkPermissions(
        permissions,
        request.user.id,
        request.collection,
      );
    } catch (error) {
      console.log(error);
      //   request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
