import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClientService } from './client.service';
import { BookSessionDto } from './dto/book-session.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';

@Controller('client')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class ClientController {
  constructor(
    private readonly clientService: ClientService
  ) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: any) {
    return this.clientService.getDashboard(
      user.userId
    );
  }

  @Get('sessions')
  sessions(@CurrentUser() user: any) {
    return this.clientService.getSessions(
      user.userId
    );
  }

  @Get('profile')
  profile(@CurrentUser() user: any) {
    return this.clientService.getProfile(
      user.userId
    );
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: any,
    @Body() body: any
  ) {
    return this.clientService.updateProfile(
      user.userId,
      body
    );
  }

  @Get('availability')
  availability(@CurrentUser() user: any) {
    return this.clientService.getAvailability(
      user.userId
    );
  }

  @Post('book')
  book(
    @CurrentUser() user: any,
    @Body() dto: BookSessionDto
  ) {
    return this.clientService.bookSession(
      user.userId,
      dto.startAt
    );
  }

  @Patch('bookings/:id/cancel')
  cancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.clientService.cancelBooking(
      user.userId,
      id
    );
  }

  @Patch('bookings/:id/reschedule')
  rescheduleBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto
  ) {
    return this.clientService.rescheduleBooking(
      user.userId,
      id,
      dto.startAt
    );
  }

  @Get('notifications')
  getNotifications(
    @CurrentUser() user: any
  ) {
    return this.clientService.getNotifications(
      user.userId
    );
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.clientService.markNotificationRead(
      user.userId,
      id
    );
  }

  @Patch('notifications/read-all')
  markAllNotificationsRead(
    @CurrentUser() user: any
  ) {
    return this.clientService.markAllNotificationsRead(
      user.userId
    );
  }
}