import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async getTrainerDashboard(trainerId: string) {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const tomorrowStart = new Date(now);
    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1
    );
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(
      tomorrowEnd.getDate() + 1
    );
    tomorrowEnd.setHours(
      23,
      59,
      59,
      999
    );

    const weekEnd = new Date(now);

    const day = weekEnd.getDay();

    const daysUntilSunday =
      day === 0 ? 0 : 7 - day;

    weekEnd.setDate(
      weekEnd.getDate() + daysUntilSunday
    );

    weekEnd.setHours(
      23,
      59,
      59,
      999
    );

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
          workoutTemplate: true,
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
          workoutTemplate: true,
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

  async getCalendar(
    trainerId: string,
    weekOffset = 0
  ) {
    const today = new Date();

    const currentDay = today.getDay();
    const mondayOffset =
      currentDay === 0 ? -6 : 1 - currentDay;

    const weekStart = new Date(today);
    weekStart.setDate(
      today.getDate() +
        mondayOffset +
        weekOffset * 7
    );
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(
      weekStart.getDate() + 6
    );
    weekEnd.setHours(23, 59, 59, 999);

    const sessions =
      await this.prisma.booking.findMany({
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
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          client: {
            include: {
              user: true,
            },
          },
          workoutTemplate: true,
        },
        orderBy: {
          startAt: 'asc',
        },
      });

    return {
      weekStart,
      weekEnd,
      sessions,
    };
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });
  }

  async markNotificationRead(
    userId: string,
    notificationId: string
  ) {
    const notification =
      await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found'
      );
    }

    return this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
      },
    });
  }
}