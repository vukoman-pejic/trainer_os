import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(trainerId: string, dto: CreateClientDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const temporaryPassword = 'welcome123';

    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      10
    );

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: UserRole.CLIENT,
        mustChangePassword: true,
      },
    });

    await this.prisma.clientProfile.create({
      data: {
        userId: user.id,
        trainerId,
        notes: dto.notes,
        injuries: dto.injuries,
        goals: dto.goals,
      },
    });

    return {
      email: dto.email,
      temporaryPassword,
    };
  }

  async findAll(trainerId: string) {
    return this.prisma.clientProfile.findMany({
      where: {
        trainerId,
      },
      include: {
        user: true,
      },
    });
  }

  async findOne(trainerId: string, clientId: string) {
    return this.prisma.clientProfile.findFirst({
      where: {
        id: clientId,
        trainerId,
      },
      include: {
        user: true,
        clientPackages: true,
        bookings: true,
      },
    });
  }
}