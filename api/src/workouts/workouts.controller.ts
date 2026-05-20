import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

@Controller('workouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class WorkoutsController {
  constructor(
    private readonly workoutsService: WorkoutsService
  ) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateWorkoutDto
  ) {
    return this.workoutsService.create(
      user.userId,
      dto
    );
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.workoutsService.findAll(
      user.userId
    );
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutDto
  ) {
    return this.workoutsService.update(
      user.userId,
      id,
      dto
    );
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.workoutsService.remove(
      user.userId,
      id
    );
  }
}