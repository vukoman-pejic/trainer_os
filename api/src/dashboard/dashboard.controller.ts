import {
  Controller,
  Get,
  Query,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService
  ) {}

  @Get('trainer')
  trainerDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getTrainerDashboard(
      user.userId
    );
  }

  @Get('calendar')
  calendar(
    @CurrentUser() user: any,
    @Query('weekOffset') weekOffset?: string
  ) {
    return this.dashboardService.getCalendar(
      user.userId,
      Number(weekOffset || 0)
    );
  }

  @Get('cancelled-sessions')
  getCancelledSessions(
    @CurrentUser() user: any,
    @Query('page') page?: string
  ) {
    return this.dashboardService.getCancelledSessions(
      user.userId,
      Number(page || 1)
    );
  }

  @Get('notifications')
  getNotifications(
    @CurrentUser() user: any,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.dashboardService.getNotifications(
      user.userId,
      take ? Number(take) : 20,
      skip ? Number(skip) : 0,
    );
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.dashboardService.markNotificationRead(
      user.userId,
      id
    );
  }

  @Patch('notifications/read-all')
  markAllNotificationsRead(
    @CurrentUser() user: any
  ) {
    return this.dashboardService.markAllNotificationsRead(
      user.userId
    );
  }
}