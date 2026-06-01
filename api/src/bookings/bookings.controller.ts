import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { AssignWorkoutDto } from './dto/assign-workout.dto';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService
  ) {}

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto
  ) {
    return this.bookingsService.reschedule(
      id,
      dto.startAt
    );
  }

  @Patch(':id/workout')
  assignWorkout(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: AssignWorkoutDto
  ) {
    return this.bookingsService.assignWorkout(
      id,
      user.userId,
      dto.workoutTemplateId
    );
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Patch(':id/approve-late-reschedule')
  approveLateReschedule(
    @Param('id') id: string
  ) {
    return this.bookingsService.approveLateReschedule(
      id
    );
  }

  @Patch(':id/reject-late-reschedule')
  rejectLateReschedule(
    @Param('id') id: string
  ) {
    return this.bookingsService.rejectLateReschedule(
      id
    );
  }

  @Post(':id/workout-log')
  saveWorkoutLog(
    @Param('id') bookingId: string,
    @Body() dto: SaveWorkoutLogDto,
  ) {
    return this.bookingsService.saveWorkoutLog(
      bookingId,
      dto,
    );
  }
}