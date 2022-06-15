import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/nonce')
  async getNonce(@Res() response: Response, @Req() request: Request) {
    const nonce = await this.authService.getNonce(request);
    response.setHeader('Content-Type', 'text/plain');
    response.send(nonce);
  }

  @Post('/connect')
  async connect(
    @Body() body: any,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const user = await this.authService.connect(body, request);
    return user;
  }

  @Post('/disconnect')
  async disconnect(@Res() response: Response, @Req() request: any) {
    request.session.destroy();
    return response.send('OK');
  }
}
