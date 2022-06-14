import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';

@Injectable()
export class RoleStrategy extends LocalStrategy {
  async validate(token: string): Promise<any> {
    const user = super.validate(token);
  }
}
