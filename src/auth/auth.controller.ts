import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConnectUserDto, ConnectUserResponseDto } from './dto/connect-user.dto';

@Controller('auth')
@ApiTags('auth.v0')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/nonce')
  async getNonce(
    @Res() response: Response,
    @Req() request: Request,
  ): Promise<string> {
    const nonce = await this.authService.getNonce(request);
    response.setHeader('Content-Type', 'text/plain');
    response.send(nonce);
    return nonce;
  }

  @Post('/connect')
  async connect(
    @Body() body: ConnectUserDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ): Promise<ConnectUserResponseDto> {
    const user = await this.authService.connect(body, request);
    return user;
  }

  @Post('/disconnect')
  async disconnect(@Res() response: Response, @Req() request: any) {
    request.session.destroy();
    return response.send('OK');
  }
}
