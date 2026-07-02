import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';

const APP_TIME_ZONE = 'Europe/Belgrade';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async getTrainerDashboard(_trainerId: string) {
    const now = DateTime.now().setZone(APP_TIME_ZONE);

    const todayStart = now.startOf('day');
    const todayEnd = now.endOf('day');

    const tomorrowStart = now.plus({ days: 1 }).startOf('day');
    const tomorrowEnd = now.plus({ days: 1 }).endOf('day');

    const weekEnd = now.endOf('week').endOf('day');

    const activeStatuses = [
      BookingStatus.CONFIRMED,
      BookingStatus.RESCHEDULED,
    ];

    const [
      todaySessions,
      tomorrowSessions,
      activeClients,
      upcomingThisWeek,
    ] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          status: {
            in: activeStatuses,
          },
          startAt: {
            gte: todayStart.toUTC().toJSDate(),
            lte: todayEnd.toUTC().toJSDate(),
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
          status: {
            in: activeStatuses,
          },
          startAt: {
            gte: tomorrowStart.toUTC().toJSDate(),
            lte: tomorrowEnd.toUTC().toJSDate(),
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

      this.prisma.clientProfile.count(),

      this.prisma.booking.count({
        where: {
          status: {
            in: activeStatuses,
          },
          startAt: {
            gte: now.toUTC().toJSDate(),
            lte: weekEnd.toUTC().toJSDate(),
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
    _trainerId: string,
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
          clientPackage: true,
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

  async getNotifications(
    userId: string,
    take = 20,
    skip = 0
  ) {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
      skip,
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

  async markAllNotificationsRead(
    userId: string
  ) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return {
      success: true,
    };
  }

  async getCancelledSessions(
    _trainerId: string,
    page = 1
  ) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const [sessions, total] =
      await Promise.all([
        this.prisma.booking.findMany({
          where: {
            status: BookingStatus.CANCELLED,
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
            cancelledAt: 'desc',
          },
          take: limit,
          skip,
        }),

        this.prisma.booking.count({
          where: {
            status: BookingStatus.CANCELLED,
          },
        }),
      ]);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(
        total / limit
      ),
    };
  }
}