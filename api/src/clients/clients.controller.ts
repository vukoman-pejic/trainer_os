import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService
  ) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateClientDto
  ) {
    return this.clientsService.create(
      user.userId,
      dto
    );
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.clientsService.findAll(
      user.userId
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.clientsService.findOne(
      user.userId,
      id
    );
  }

  @Get(':id/bookings')
  findBookings(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.clientsService.findBookings(
      user.userId,
      id
    );
  }
}