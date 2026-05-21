import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActorType,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

  private getSlotCapacity(date: Date) {
    const hour = date.getHours();

    if (hour === 9 || hour === 11) {
      return 1;
    }

    return 5;
  }

  private validateSlot(startAt: Date) {
    const hour = startAt.getHours();
    const minutes = startAt.getMinutes();

    const allowedHours = [
      8, 9, 10, 11, 16, 17, 18, 19, 20, 21,
    ];

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
    const today = new Date();

    const currentDay = today.getDay();

    const mondayOffset =
      currentDay === 0
        ? -6
        : 1 - currentDay;

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(
      today.getDate() + mondayOffset
    );
    currentWeekStart.setHours(0, 0, 0, 0);

    const nextWeekEnd = new Date(
      currentWeekStart
    );
    nextWeekEnd.setDate(
      currentWeekStart.getDate() + 13
    );
    nextWeekEnd.setHours(
      23,
      59,
      59,
      999
    );

    return {
      currentWeekStart,
      nextWeekEnd,
    };
  }

  private getNextWeekRange() {
    const today = new Date();

    const currentDay = today.getDay();

    const mondayOffset =
      currentDay === 0 ? 1 : 8 - currentDay;

    const weekStart = new Date(today);

    weekStart.setDate(
      today.getDate() + mondayOffset
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

    return {
      weekStart,
      weekEnd,
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

    const days = Array.from(
      { length: 14 },
      (_, dayIndex) => {
        const date = new Date(currentWeekStart);
        date.setDate(
          currentWeekStart.getDate() + dayIndex
        );

        return {
          date,
          slots: this.slots.map((slot) => {
            const [hour, minute] = slot
              .split(':')
              .map(Number);

            const startAt = new Date(date);
            startAt.setHours(
              hour,
              minute,
              0,
              0
            );

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
                startAt >=
                this.getNextWeekRange().weekStart,
            };
          }),
        };
      }
    );

    const { weekStart, weekEnd } =
      this.getNextWeekRange();

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
            });

          if (!activePackage) {
            throw new BadRequestException(
              'No active package'
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

          return tx.booking.update({
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
}