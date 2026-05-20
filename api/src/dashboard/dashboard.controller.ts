import {
  Controller,
  Get,
  Query,
  UseGuards,
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
}