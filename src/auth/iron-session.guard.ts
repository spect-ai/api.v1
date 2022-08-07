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
export class GithubBotAuthGuard implements CanActivate {
  constructor(private readonly sessionAuthGuard: SessionAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const githubId = request.body.githubId;
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
export class ConnectedGithubAuthGuard implements CanActivate {
  constructor(private readonly sessionAuthGuard: SessionAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      const githubId = request.body.githubId;
      request.user = await this.sessionAuthGuard.validateUser(
        request.session.siwe?.address,
      );
      if (!request.user) return false;
      return true;
    } catch (error) {
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
