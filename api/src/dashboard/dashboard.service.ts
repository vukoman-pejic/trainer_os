import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async getTrainerDashboard(trainerId: string) {
    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const tomorrowStart = new Date();
    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1
    );
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(
      tomorrowEnd.getDate() + 1
    );
    tomorrowEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [
      todaySessions,
      tomorrowSessions,
      activeClients,
      upcomingThisWeek,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          client: {
            trainerId,
          },
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          startAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          client: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          startAt: 'asc',
        },
      }),

      this.prisma.booking.findMany({
        where: {
          client: {
            trainerId,
          },
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          startAt: {
            gte: tomorrowStart,
            lte: tomorrowEnd,
          },
        },
        include: {
          client: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          startAt: 'asc',
        },
      }),

      this.prisma.clientProfile.count({
        where: {
          trainerId,
        },
      }),

      this.prisma.booking.count({
        where: {
          client: {
            trainerId,
          },
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          startAt: {
            gte: now,
            lte: weekEnd,
          },
        },
      }),
    ]);

    return {
      todaySessions,
      tomorrowSessions,
      activeClients,
      upcomingThisWeek,
    };
  }
}