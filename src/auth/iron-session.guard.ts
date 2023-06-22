import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';
import { KeysRepository } from 'src/users/keys.repository';
import { UsersRepository } from 'src/users/users.repository';
import { RateLimitCacheService } from './rate-limit-cache.service';
import { EncryptionService } from 'src/common/encryption.service';
import { QueryBus } from '@nestjs/cqrs';
import { Collection } from 'src/collection/model/collection.model';
import { GetCollectionBySlugQuery } from 'src/collection/queries';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly ethAddressService: EthAddressService,
    private readonly keysRepository: KeysRepository,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitCacheService: RateLimitCacheService,
    private readonly encryptionService: EncryptionService,
  ) {}

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
      if (request.session.siwe?.address) {
        request.user = await this.validateUser(request.session.siwe?.address);
        if (!request.user) return false;
      } else if (request.headers['x-api-key']) {
        const keyData = await this.keysRepository.findOne({
          key: this.encryptionService.encrypt(request.headers['x-api-key']),
        });
        if (!keyData?.userId) return false;
        request.user = await this.usersRepository.findById(keyData.userId);
      } else return false;

      if (
        request.headers['x-api-key'] &&
        this.rateLimitCacheService.hasCrossedLimit(request.user.id)
      ) {
        throw new HttpException(
          'You have exceeded the rate limit. Please try again later.',
          429,
        );
      } else {
        this.rateLimitCacheService.addOrIncrement(request.user.id);
      }

      return true;
    } catch (error) {
      request.session.destroy();
      if (error instanceof HttpException) throw error;
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  async validateUser(address: string): Promise<ObjectId | boolean> {
    return [
      '0x55b23ed53fe13060183b92979c737a8ef9a73b73',
      '0x6304ce63f2ebf8c0cc76b60d34cc52a84abb6057',
    ].includes(address.toLowerCase());
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = await this.validateUser(
        request.session.siwe?.address?.toLowerCase(),
      );
      if (!request.user) return false;
      return true;
    } catch (error) {
      request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}

@Injectable()
export class AIWhitelistAuthGuard implements CanActivate {
  constructor(private readonly queryBus: QueryBus) {}

  async validateUser(address: string): Promise<ObjectId | boolean> {
    const whitelistSlug = 'c6270b30-a25f-4b46-a563-a3d674913604';
    const whitelistedForField = '1dccb71a-3f85-43d8-b14b-de6951c41f6b';
    const ethAddressField = '2f2aba52-2784-48ed-a558-00076d270ea6';

    const changelog_collection: Collection = await this.queryBus.execute(
      new GetCollectionBySlugQuery(whitelistSlug),
    );
    const rows = Object.values(changelog_collection?.data);

    const whitelistedRows = rows.filter(
      (row) =>
        row[whitelistedForField] &&
        row[whitelistedForField].includes('AI Workflows'),
    );

    const whitelistedAddresses = whitelistedRows.map((row) =>
      row[ethAddressField].toLowerCase(),
    );

    return whitelistedAddresses.includes(address);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      request.user = await this.validateUser(
        request.session.siwe?.address?.toLowerCase(),
      );
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
      return true;
      // request.session.destroy();
      // throw new HttpException({ message: error }, 422);
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

@Injectable()
export class FrontendServerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      // get secret key from request header
      const secretKey = request.headers['x-secret-key'];
      // check if secret key is valid
      if (secretKey !== process.env.FRONTEND_SECRET_KEY) {
        return false;
      }
      return true;
    } catch (error) {
      return true;
    }
  }
}
