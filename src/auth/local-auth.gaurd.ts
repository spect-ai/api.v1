import { AuthGuard } from '@nestjs/passport';

export class LocalAuthGuard extends AuthGuard('bearer') {}
