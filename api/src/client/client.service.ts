import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async getDashboard(userId: string) {
    const now = new Date();

    const profile =
      await this.prisma.clientProfile.findUnique({
        where: {
          userId,
        },
        include: {
          user: true,
          trainer: true,
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

    if (!profile) {
      throw new Error('Client not found');
    }

    const nextSession =
      await this.prisma.booking.findFirst({
        where: {
          clientId: profile.id,
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
        },
        orderBy: {
          startAt: 'asc',
        },
      });

    const recentPastSessions =
      await this.prisma.booking.findMany({
        where: {
          clientId: profile.id,
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
        },
        orderBy: {
          startAt: 'desc',
        },
        take: 3,
      });

    return {
      profile,
      activePackage:
        profile.clientPackages[0] || null,
      nextSession,
      recentPastSessions,
    };
  }

  async getSessions(userId: string) {
    const now = new Date();

    const profile =
      await this.prisma.clientProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      throw new Error('Client not found');
    }

    const upcomingSessions =
      await this.prisma.booking.findMany({
        where: {
          clientId: profile.id,
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
        },
        orderBy: {
          startAt: 'asc',
        },
      });

    const pastSessions =
      await this.prisma.booking.findMany({
        where: {
          clientId: profile.id,
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
        },
        orderBy: {
          startAt: 'desc',
        },
      });

    return {
      upcomingSessions,
      pastSessions,
    };
  }

  async getProfile(userId: string) {
    return this.prisma.clientProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: true,
        trainer: true,
      },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      phone?: string;
      goals?: string;
      injuries?: string;
    }
  ) {
    const profile =
      await this.prisma.clientProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      throw new Error('Client not found');
    }

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        phone: data.phone,
      },
    });

    return this.prisma.clientProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        goals: data.goals,
        injuries: data.injuries,
      },
      include: {
        user: true,
        trainer: true,
      },
    });
  }
}