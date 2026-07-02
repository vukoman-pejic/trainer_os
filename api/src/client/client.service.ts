import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorType,
  BookingStatus,
  Prisma,
  PaymentStatus,
  NotificationType
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DateTime } from 'luxon';

const APP_TIME_ZONE = 'Europe/Belgrade';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly slots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
  ];

  private createBelgradeDate(date: string, time: string) {
    return DateTime.fromISO(`${date}T${time}`, {
      zone: APP_TIME_ZONE,
    })
      .toUTC()
      .toJSDate();
  }

  private toBelgradeDateTime(date: Date) {
    return DateTime.fromJSDate(date, {
      zone: 'utc',
    }).setZone(APP_TIME_ZONE);
  }

  private formatBelgradeDateTime(date: Date) {
    return DateTime.fromJSDate(date, {
      zone: 'utc',
    })
      .setZone(APP_TIME_ZONE)
      .toFormat('dd.MM.yyyy. HH:mm');
  }

  private getSlotCapacity(date: Date) {
    const belgradeDate = this.toBelgradeDateTime(date);

    const day = belgradeDate.weekday % 7;
    const hour = belgradeDate.hour;

    const isSaturday = day === 6;

    if (!isSaturday && (hour === 9 || hour === 11)) {
      return 1;
    }

    return 5;
  }

  private validateSlot(startAt: Date) {
    const belgradeDate = this.toBelgradeDateTime(startAt);

    const day = belgradeDate.weekday % 7;

    if (day === 0) {
      throw new BadRequestException(
        'Studio is closed on Sundays'
      );
    }

    const hour = belgradeDate.hour;
    const minutes = belgradeDate.minute;

    const weekdayHours = [
      8,
      9,
      10,
      11,
      16,
      17,
      18,
      19,
      20,
      21,
    ];

    const saturdayHours = [
      8,
      9,
      10,
      11,
    ];

    const allowedHours =
      day === 6
        ? saturdayHours
        : weekdayHours;

    if (
      minutes !== 0 ||
      !allowedHours.includes(hour)
    ) {
      throw new BadRequestException(
        'Invalid training slot'
      );
    }
  }

  private getAvailabilityRange() {
    const today = DateTime.now().setZone(APP_TIME_ZONE);

    const currentWeekStart = today
      .startOf('week')
      .startOf('day');

    const nextWeekEnd = currentWeekStart
      .plus({ days: 13 })
      .endOf('day');

    return {
      currentWeekStart: currentWeekStart.toUTC().toJSDate(),
      nextWeekEnd: nextWeekEnd.toUTC().toJSDate(),
    };
  }

  private getNextWeekRange() {
    const today = DateTime.now().setZone(APP_TIME_ZONE);

    const weekStart = today
      .startOf('week')
      .plus({ weeks: 1 })
      .startOf('day');

    const weekEnd = weekStart
      .plus({ days: 6 })
      .endOf('day');

    return {
      weekStart: weekStart.toUTC().toJSDate(),
      weekEnd: weekEnd.toUTC().toJSDate(),
    };
  }

  private isInsideRange(
    date: Date,
    start: Date,
    end: Date
  ) {
    return date >= start && date <= end;
  }

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
      throw new NotFoundException(
        'Client not found'
      );
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
      throw new NotFoundException(
        'Client not found'
      );
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
      throw new NotFoundException(
        'Client not found'
      );
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

  async getAvailability(userId: string) {
    const profile =
      await this.prisma.clientProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      throw new NotFoundException(
        'Client not found'
      );
    }

    const {
      currentWeekStart,
      nextWeekEnd,
    } = this.getAvailabilityRange();

    const { weekStart, weekEnd } =
      this.getNextWeekRange();

    const bookings =
      await this.prisma.booking.findMany({
        where: {
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          startAt: {
            gte: currentWeekStart,
            lte: nextWeekEnd,
          },
        },
        select: {
          id: true,
          clientId: true,
          startAt: true,
        },
      });

    const currentWeekStartBelgrade =
      DateTime.fromJSDate(currentWeekStart, {
        zone: 'utc',
      }).setZone(APP_TIME_ZONE);

    const days = Array.from(
      { length: 14 },
      (_, dayIndex) => {
        const dayDate = currentWeekStartBelgrade
          .plus({ days: dayIndex })
          .toFormat('yyyy-MM-dd');

        return {
          date: dayDate,
          slots: this.slots.map((slot) => {
            const startAt =
              this.createBelgradeDate(dayDate, slot);

            const capacity =
              this.getSlotCapacity(startAt);

            const slotBookings =
              bookings.filter(
                (booking) =>
                  booking.startAt.getTime() ===
                  startAt.getTime()
              );

            const bookedCount =
              slotBookings.length;

            const clientBooking =
              slotBookings.find(
                (booking) =>
                  booking.clientId === profile.id
              );

            const bookedByClient =
              !!clientBooking;

            return {
              startAt,
              time: slot,
              capacity,
              bookedCount,
              availableCount:
                capacity - bookedCount,
              isFull:
                bookedCount >= capacity,
              bookedByClient,
              clientBookingId:
                clientBooking?.id || null,
              isBookable:
                startAt >= weekStart,
            };
          }),
        };
      }
    );

    const clientBookingsThisWeek =
      bookings.filter(
        (booking) =>
          booking.clientId === profile.id &&
          booking.startAt >= weekStart &&
          booking.startAt <= weekEnd
      ).length;

    return {
      weekStart: currentWeekStart,
      weekEnd: nextWeekEnd,
      maxBookingsPerWeek: 3,
      clientBookingsThisWeek,
      days,
    };
  }

  async bookSession(
    userId: string,
    startAtIso: string
  ) {
    const startAt = new Date(startAtIso);
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 1);

    this.validateSlot(startAt);

    const { weekStart, weekEnd } =
      this.getNextWeekRange();

    if (
      !this.isInsideRange(
        startAt,
        weekStart,
        weekEnd
      )
    ) {
      throw new BadRequestException(
        'You can only book sessions for next week'
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const profile =
            await tx.clientProfile.findUnique({
              where: {
                userId,
              },
              include: {
                user: true,
              },
            });

          if (!profile) {
            throw new NotFoundException(
              'Client not found'
            );
          }

          const activePackage =
            await tx.clientPackage.findFirst({
              where: {
                clientId: profile.id,
                active: true,
              },
              include: {
                package: true,
              },
            });

          if (!activePackage) {
            throw new BadRequestException(
              'No active package'
            );
          }

          if (
            this.isIndividualOnlySlot(startAt) &&
            !this.isIndividualPackage(
              activePackage.package.name
            )
          ) {
            throw new BadRequestException(
              'This slot is available only for individual packages'
            );
          }

          if (
            activePackage.remainingSessions <= 0
          ) {
            throw new BadRequestException(
              'No remaining sessions'
            );
          }

          const clientBookingsThisWeek =
            await tx.booking.count({
              where: {
                clientId: profile.id,
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
            });

          if (clientBookingsThisWeek >= 3) {
            throw new BadRequestException(
              'Maximum 3 bookings per week allowed'
            );
          }

          const existingClientSlot =
            await tx.booking.findFirst({
              where: {
                clientId: profile.id,
                startAt,
                status: {
                  in: [
                    BookingStatus.CONFIRMED,
                    BookingStatus.RESCHEDULED,
                  ],
                },
              },
            });

          if (existingClientSlot) {
            throw new BadRequestException(
              'You already booked this slot'
            );
          }

          const capacity =
            this.getSlotCapacity(startAt);

          const bookingsCount =
            await tx.booking.count({
              where: {
                startAt,
                status: {
                  in: [
                    BookingStatus.CONFIRMED,
                    BookingStatus.RESCHEDULED,
                  ],
                },
              },
            });

          if (bookingsCount >= capacity) {
            throw new BadRequestException(
              'Selected slot is full'
            );
          }

          const booking =
            await tx.booking.create({
              data: {
                clientId: profile.id,
                clientPackageId:
                  activePackage.id,
                startAt,
                endAt,
                status:
                  BookingStatus.CONFIRMED,
                createdBy: ActorType.CLIENT,
              },
            });

          await this.notifyTrainer(
            tx,
            profile.trainerId,
            NotificationType.CLIENT_BOOKED,
            'New Session Booked',
            `${profile.user.firstName} ${profile.user.lastName} booked a session at ${this.formatBelgradeDateTime(startAt)}`
          );

          await tx.clientPackage.update({
            where: {
              id: activePackage.id,
            },
            data: {
              remainingSessions:
                activePackage.remainingSessions -
                1,
              active:
                activePackage.remainingSessions -
                  1 >
                0,
            },
          });

          return booking;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );
    } catch (error: any) {
      if (error.code === 'P2034') {
        throw new BadRequestException(
          'This slot was just booked. Please choose another one.'
        );
      }

      throw error;
    }
  }

  async cancelBooking(
    userId: string,
    bookingId: string
  ) {
    const profile =
      await this.prisma.clientProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!profile) {
      throw new NotFoundException(
        'Client not found'
      );
    }

    const booking =
      await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          clientId: profile.id,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
        },
        include: {
          clientPackage: true,
          client: {
            include: {
              user: true,
              trainer: true,
            },
          },
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found'
      );
    }

    const now = new Date();

    const diffMs =
      booking.startAt.getTime() -
      now.getTime();

    const diffHours =
      diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      throw new BadRequestException(
        'Bookings can only be cancelled at least 24 hours before the session'
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        await tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            status:
              BookingStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelledBy: ActorType.CLIENT,
          },
        });

        await tx.clientPackage.update({
          where: {
            id: booking.clientPackage.id,
          },
          data: {
            remainingSessions:
              booking.clientPackage
                .remainingSessions + 1,
            active: true,
          },
        });
        await this.notifyTrainer(
          tx,
          booking.client.trainerId,
          NotificationType.CLIENT_CANCELLED,
          'Session Cancelled',
          `${booking.client.user.firstName} ${booking.client.user.lastName} cancelled a session on ${this.formatBelgradeDateTime(booking.startAt)}`
        );
        await this.notifyAvailableSlot(
          tx,
          booking.startAt,
          profile.id
        );
      }
    );

    return {
      success: true,
    };
  }

  async rescheduleBooking(
    userId: string,
    bookingId: string,
    newStartAtIso: string
  ) {
    const newStartAt = new Date(
      newStartAtIso
    );

    const newEndAt = new Date(
      newStartAt
    );

    newEndAt.setHours(
      newEndAt.getHours() + 1
    );

    this.validateSlot(newStartAt);

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const profile =
            await tx.clientProfile.findUnique({
              where: {
                userId,
              },
            });

          if (!profile) {
            throw new NotFoundException(
              'Client not found'
            );
          }

          const booking =
            await tx.booking.findFirst({
              where: {
                id: bookingId,
                clientId: profile.id,
                status: {
                  in: [
                    BookingStatus.CONFIRMED,
                    BookingStatus.RESCHEDULED,
                  ],
                },
              },
              include: {
                client: {
                  include: {
                    user: true,
                  },
                },
                clientPackage: {
                  include: {
                    package: true,
                  },
                },
              },
            });

          if (!booking) {
            throw new NotFoundException(
              'Booking not found'
            );
          }

          if (
            this.isIndividualOnlySlot(newStartAt) &&
            !this.isIndividualPackage(
              booking.clientPackage.package.name
            )
          ) {
            throw new BadRequestException(
              'This slot is available only for individual packages'
            );
          }

          const oldStartAt = booking.startAt;

          const now = new Date();

          const diffMs =
            booking.startAt.getTime() -
            now.getTime();

          const diffHours =
            diffMs / (1000 * 60 * 60);

          if (diffHours < 3) {
            throw new BadRequestException(
              'Bookings can only be rescheduled at least 3 hours before the session'
            );
          }

          const originalWeekStart =
            new Date(booking.startAt);

          const originalDay =
            originalWeekStart.getDay();

          const mondayOffset =
            originalDay === 0
              ? -6
              : 1 - originalDay;

          originalWeekStart.setDate(
            originalWeekStart.getDate() +
              mondayOffset
          );

          originalWeekStart.setHours(
            0,
            0,
            0,
            0
          );

          const originalWeekEnd =
            new Date(originalWeekStart);

          originalWeekEnd.setDate(
            originalWeekStart.getDate() + 6
          );

          originalWeekEnd.setHours(
            23,
            59,
            59,
            999
          );

          if (
            !this.isInsideRange(
              newStartAt,
              originalWeekStart,
              originalWeekEnd
            )
          ) {
            throw new BadRequestException(
              'Reschedule is only allowed within the same week'
            );
          }

          if (
            newStartAt.getTime() ===
            booking.startAt.getTime()
          ) {
            throw new BadRequestException(
              'Please select a different slot'
            );
          }

          const existingClientSlot =
            await tx.booking.findFirst({
              where: {
                clientId: profile.id,
                startAt: newStartAt,
                status: {
                  in: [
                    BookingStatus.CONFIRMED,
                    BookingStatus.RESCHEDULED,
                  ],
                },
                id: {
                  not: booking.id,
                },
              },
            });

          if (existingClientSlot) {
            throw new BadRequestException(
              'You already booked this slot'
            );
          }

          const capacity =
            this.getSlotCapacity(
              newStartAt
            );

          const bookingsCount =
            await tx.booking.count({
              where: {
                startAt: newStartAt,
                status: {
                  in: [
                    BookingStatus.CONFIRMED,
                    BookingStatus.RESCHEDULED,
                  ],
                },
                id: {
                  not: booking.id,
                },
              },
            });

          if (bookingsCount >= capacity) {
            throw new BadRequestException(
              'Selected slot is full'
            );
          }

          const requiresApproval =
            this.toBelgradeDateTime(newStartAt).hour === 21;

          if (requiresApproval) {
            await tx.booking.update({
              where: {
                id: booking.id,
              },
              data: {
                status:
                  BookingStatus.PENDING_APPROVAL,
                requestedStartAt: newStartAt,
                requestedEndAt: newEndAt,
              },
            });

            await tx.notification.create({
              data: {
                userId: booking.client.trainerId,
                bookingId: booking.id,
                type:
                  NotificationType.LATE_RESCHEDULE_REQUEST,
                title: 'Late Session Approval',
                message: `${booking.client.user.firstName} ${booking.client.user.lastName} requested reschedule to ${this.formatBelgradeDateTime(newStartAt)}`,
              },
            });

            return {
              success: true,
              pendingApproval: true,
            };
          }

          const updatedBooking =
            await tx.booking.update({
              where: {
                id: booking.id,
              },
              data: {
                startAt: newStartAt,
                endAt: newEndAt,
                status:
                  BookingStatus.RESCHEDULED,
              },
            });

          await this.notifyTrainer(
            tx,
            booking.client.trainerId,
            NotificationType.CLIENT_RESCHEDULED,
            'Session Rescheduled',
            `${booking.client.user.firstName} ${booking.client.user.lastName} rescheduled from ${this.formatBelgradeDateTime(oldStartAt)} to ${this.formatBelgradeDateTime(newStartAt)}`
          );

          await this.notifyAvailableSlot(
            tx,
            oldStartAt,
            profile.id
          );

          return updatedBooking;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        }
      );
    } catch (error: any) {
      if (error.code === 'P2034') {
        throw new BadRequestException(
          'This slot was just booked. Please choose another one.'
        );
      }

      throw error;
    }
  }

  private async notifyAvailableSlot(
    tx: Prisma.TransactionClient,
    freedStartAt: Date,
    excludingClientId?: string
  ) {
    const capacity =
      this.getSlotCapacity(freedStartAt);

    const activeBookings =
      await tx.booking.count({
        where: {
          startAt: freedStartAt,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
        },
      });

    if (activeBookings >= capacity) {
      return;
    }

    const weekStart = new Date(
      freedStartAt
    );

    const day = weekStart.getDay();

    const mondayOffset =
      day === 0 ? -6 : 1 - day;

    weekStart.setDate(
      weekStart.getDate() + mondayOffset
    );

    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);

    weekEnd.setDate(
      weekStart.getDate() + 6
    );

    weekEnd.setHours(
      23,
      59,
      59,
      999
    );

    const eligibleClients =
      await tx.clientProfile.findMany({
        include: {
          user: true,
          clientPackages: {
            where: {
              paymentStatus:
                PaymentStatus.PAID,
              remainingSessions: {
                gt: 0,
              },
            },
          },
        },
      });

    const notifications = [];

    for (const client of eligibleClients) {
      if (
        excludingClientId &&
        client.id === excludingClientId
      ) {
        continue;
      }

      if (
        client.clientPackages.length === 0
      ) {
        continue;
      }

      const alreadyBooked =
        await tx.booking.findFirst({
          where: {
            clientId: client.id,
            startAt: freedStartAt,
            status: {
              in: [
                BookingStatus.CONFIRMED,
                BookingStatus.RESCHEDULED,
              ],
            },
          },
        });

      if (alreadyBooked) {
        continue;
      }

      const weeklyCount =
        await tx.booking.count({
          where: {
            clientId: client.id,
            startAt: {
              gte: weekStart,
              lte: weekEnd,
            },
            status: {
              in: [
                BookingStatus.CONFIRMED,
                BookingStatus.RESCHEDULED,
              ],
            },
          },
        });

      if (weeklyCount >= 3) {
        continue;
      }

      notifications.push({
        userId: client.userId,
        type:
          NotificationType.SLOT_AVAILABLE,
        title: 'Spot Available',
        message: `A session at ${this.formatBelgradeDateTime(freedStartAt)} just became available.`,
      });
    }

    if (notifications.length > 0) {
      await tx.notification.createMany({
        data: notifications,
      });
    }
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

  private async notifyTrainer(
    tx: Prisma.TransactionClient,
    trainerUserId: string,
    type: NotificationType,
    title: string,
    message: string
  ) {
    await tx.notification.create({
      data: {
        userId: trainerUserId,
        type,
        title,
        message,
      },
    });
  }

  private isIndividualOnlySlot(startAt: Date) {
    const belgradeDate = this.toBelgradeDateTime(startAt);

    const day = belgradeDate.weekday % 7;
    const hour = belgradeDate.hour;

    const isSaturday = day === 6;

    return !isSaturday && (hour === 9 || hour === 11);
  }

  private isIndividualPackage(packageName: string) {
    return [
      '8 Individual',
      '12 Individual',
    ].includes(packageName);
  }
}