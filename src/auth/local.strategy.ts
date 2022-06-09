import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'token',
      passwordField: 'token',
    });
  }

  async validate(token: string): Promise<any> {
    const user = await this.authService.ValidateUser(token);
    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
