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
    // const collatedUserPermissions =
    //   await this.circlesService.getCollatedUserPermissions(circleIds, userId);
    // for (const permission of permissions) {
    //   if (!collatedUserPermissions[permission]) return false;
    // }
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

      console.log(request.params.id);
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
      request.user = (await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      )) as unknown as User;
      if (collection.privateResponses) {
        if (!request.user) return false;

        return await this.isMember(collection.parents, request.user.id);
      }

      return true;
    } catch (error) {
      console.log(error);
      // request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
