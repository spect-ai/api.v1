import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
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
