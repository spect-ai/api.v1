import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { EncryptionService } from 'src/common/encryption.service';

@Injectable()
export class BotAuthGuard implements CanActivate {
  constructor(private readonly encryptionService: EncryptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      if (
        this.encryptionService.decrypt(request.headers.secret) !==
        process.env.API_SECRET
      ) {
        return false;
      }
      return true;
    } catch (error) {
      console.log(error);
      // request.session.destroy();
      throw new HttpException({ message: error }, 422);
    }
  }
}
