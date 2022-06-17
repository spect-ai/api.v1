import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { CirclesService } from 'src/circle/circles.service';
import { RolesService } from 'src/roles/roles.service';
import { EthAddressService } from 'src/_eth-address/_eth-address.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly ethAddressService: EthAddressService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.session.siwe?.address) {
      const user = (
        await this.ethAddressService.findByAddress(
          request.session.siwe?.address.toLowerCase(),
        )
      )?.user;
      if (!user) {
        request.session.destroy();
        throw new HttpException(
          { message: 'Invalid session./ User not found' },
          422,
        );
      }
      request.user = user;
      return true;
    }
    return false;
  }
}

@Injectable()
export class CircleRoleGuard implements CanActivate {
  constructor(
    private readonly ethAddressService: EthAddressService,
    private readonly circleService: CirclesService,
    private readonly roleService: RolesService,
  ) {}

  private async getActionsFromRoute(route: string) {
    return ['createNewCircle'];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log(request);
    console.log(request.route);

    if (request.session.siwe?.address) {
      const user = (
        await this.ethAddressService.findByAddress(
          request.session.siwe?.address.toLowerCase(),
        )
      )?.user;
      if (!user) {
        request.session.destroy();
        throw new HttpException(
          { message: 'Invalid session./ User not found' },
          422,
        );
      }

      request.user = user;
      return true;
    }
    return false;
  }
}
