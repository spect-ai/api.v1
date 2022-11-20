import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from 'src/auth/iron-session.guard';
import { NotificationService } from './notification.service';

@Controller('notification')
@ApiTags('notification.v1')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(AdminAuthGuard)
  @Post('/sendWeeklyOpportunityDigest')
  async getProfile(@Request() req): Promise<boolean> {
    return await this.notificationService.sendWeeklyOpportunityDigest(req.user);
  }
}
