import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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

    const temporaryPassword = randomBytes(6)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10);

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

  async findAll(_trainerId: string) {
    return this.prisma.clientProfile.findMany({
      include: {
        user: true,
      },
    });
  }

  async findOne(
    _trainerId: string,
    clientId: string
  ) {
    const now = new Date();

    const client =
      await this.prisma.clientProfile.findFirst({
        where: {
          id: clientId,
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
          workoutLog: {
            include: {
              exercises: true,
            },
          },
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
          workoutLog: {
            include: {
              exercises: true,
            },
          },
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
    _trainerId: string,
    clientId: string
  ) {
    return this.prisma.booking.findMany({
      where: {
        clientId,
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

  async remove(
    _trainerId: string,
    clientId: string
  ) {
    const client =
      await this.prisma.clientProfile.findFirst({
        where: {
          id: clientId,
        },
        include: {
          user: true,
        },
      });

    if (!client) {
      throw new BadRequestException(
        'Client not found'
      );
    }

    await this.prisma.user.delete({
      where: {
        id: client.user.id,
      },
    });

    return {
      success: true,
    };
  }

  private generateTempPassword() {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';

    let password = '';

    for (let i = 0; i < 10; i++) {
      password +=
        chars[
          Math.floor(
            Math.random() * chars.length
          )
        ];
    }

    return password;
  }

  async resetPassword(
    _trainerId: string,
    clientId: string
  ) {
    const client =
      await this.prisma.clientProfile.findFirst({
        where: {
          id: clientId,
        },
        include: {
          user: true,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Client not found'
      );
    }

    const tempPassword =
      this.generateTempPassword();

    const passwordHash =
      await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: {
        id: client.user.id,
      },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return {
      tempPassword,
    };
  }
}