import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  BookingStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    trainerId: string,
    dto: CreateClientDto
  ) {
    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists'
      );
    }

    const temporaryPassword =
      'welcome123';

    const passwordHash =
      await bcrypt.hash(
        temporaryPassword,
        10
      );

    const user =
      await this.prisma.user.create({
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

  async findOne(
    trainerId: string,
    clientId: string
  ) {
    const now = new Date();

    const client =
      await this.prisma.clientProfile.findFirst({
        where: {
          id: clientId,
          trainerId,
        },
        include: {
          user: true,
          clientPackages: {
            where: {
              active: true,
            },
            include: {
              package: true,
            },
          },
        },
      });

    if (!client) {
      throw new BadRequestException(
        'Client not found'
      );
    }

    const upcomingSessions =
      await this.prisma.booking.findMany({
        where: {
          clientId,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          endAt: {
            gt: now,
          },
        },
        include: {
          workoutTemplate: true,
          clientPackage: {
            include: {
              package: true,
            },
          },
        },
        orderBy: {
          startAt: 'asc',
        },
      });

    const pastSessions =
      await this.prisma.booking.findMany({
        where: {
          clientId,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          endAt: {
            lt: now,
          },
        },
        include: {
          workoutTemplate: true,
          clientPackage: {
            include: {
              package: true,
            },
          },
        },
        orderBy: {
          startAt: 'desc',
        },
        take: 5,
      });

    return {
      ...client,
      upcomingSessions,
      pastSessions,
    };
  }

  async findBookings(
    trainerId: string,
    clientId: string
  ) {
    return this.prisma.booking.findMany({
      where: {
        clientId,
        client: {
          trainerId,
        },
        endAt: {
          gt: new Date(),
        },
        status: {
          in: [
            BookingStatus.CONFIRMED,
            BookingStatus.RESCHEDULED,
          ],
        },
      },
      include: {
        workoutTemplate: true,
        clientPackage: {
          include: {
            package: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }
}