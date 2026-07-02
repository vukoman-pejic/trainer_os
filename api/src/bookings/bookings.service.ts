import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorType, BookingStatus, NotificationType, Prisma, } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SaveWorkoutLogDto } from './dto/save-workout-log.dto';
import { DateTime } from 'luxon';

const APP_TIME_ZONE = 'Europe/Belgrade';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private toBelgradeDateTime(date: Date) {
    return DateTime.fromJSDate(date, {
      zone: 'utc',
    }).setZone(APP_TIME_ZONE);
  }

  private getBelgradeDayRange(date: Date) {
    const belgradeDate =
      this.toBelgradeDateTime(date);

    return {
      dayStart: belgradeDate
        .startOf('day')
        .toUTC()
        .toJSDate(),
      dayEnd: belgradeDate
        .endOf('day')
        .toUTC()
        .toJSDate(),
    };
  }

  private formatBelgradeDateTime(date: Date) {
    return this.toBelgradeDateTime(date).toFormat(
      'dd.MM.yyyy. HH:mm'
    );
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
    const belgradeDate =
      this.toBelgradeDateTime(startAt);

    const day = belgradeDate.weekday % 7;
    const hour = belgradeDate.hour;
    const minutes = belgradeDate.minute;

    if (day === 0) {
      throw new BadRequestException(
        'Studio is closed on Sundays'
      );
    }

    const weekdayHours = [
      8, 9, 10, 11, 16, 17, 18, 19, 20, 21,
    ];

    const saturdayHours = [8, 9, 10, 11];

    const allowedHours =
      day === 6 ? saturdayHours : weekdayHours;

    if (
      minutes !== 0 ||
      !allowedHours.includes(hour)
    ) {
      throw new BadRequestException(
        'Invalid training slot'
      );
    }
  }

  private async validateBookingRules(
    clientId: string,
    startAt: Date,
    ignoreBookingId?: string
  ) {
    const now = new Date();

    if (startAt <= now) {
      throw new BadRequestException(
        'Cannot create booking in the past'
      );
    }

    this.validateSlot(startAt);

    const { dayStart, dayEnd } =
      this.getBelgradeDayRange(startAt);

    const existingClientBooking =
      await this.prisma.booking.findFirst({
        where: {
          clientId,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          startAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          ...(ignoreBookingId
            ? {
                id: {
                  not: ignoreBookingId,
                },
              }
            : {}),
        },
      });

    if (existingClientBooking) {
      throw new BadRequestException(
        'Client already has a booking for this day'
      );
    }

    const capacity =
      this.getSlotCapacity(startAt);

    const bookingsCount =
      await this.prisma.booking.count({
        where: {
          startAt,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
          ...(ignoreBookingId
            ? {
                id: {
                  not: ignoreBookingId,
                },
              }
            : {}),
        },
      });

    if (bookingsCount >= capacity) {
      throw new BadRequestException(
        'Selected slot is full'
      );
    }
  }

  async create(dto: CreateBookingDto) {
    const startAt = new Date(dto.startAt);
    const endAt = DateTime.fromJSDate(startAt, {
      zone: 'utc',
    })
      .plus({ hours: 1 })
      .toJSDate();

    const client =
      await this.prisma.clientProfile.findUnique({
        where: {
          id: dto.clientId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Client not found'
      );
    }

    const activePackage =
      await this.prisma.clientPackage.findFirst({
        where: {
          clientId: dto.clientId,
          active: true,
        },
      });

    if (!activePackage) {
      throw new BadRequestException(
        'Client has no active package'
      );
    }

    if (activePackage.remainingSessions <= 0) {
      throw new BadRequestException(
        'Client has no remaining sessions'
      );
    }

    await this.validateBookingRules(
      dto.clientId,
      startAt
    );

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          clientId: dto.clientId,
          clientPackageId: activePackage.id,
          startAt,
          endAt,
          status: BookingStatus.CONFIRMED,
          createdBy: ActorType.TRAINER,
        },
      });

      await tx.clientPackage.update({
        where: {
          id: activePackage.id,
        },
        data: {
          remainingSessions:
            activePackage.remainingSessions - 1,
          active:
            activePackage.remainingSessions - 1 > 0,
        },
      });

      return booking;
    });
  }

  async cancel(bookingId: string) {
    const booking =
      await this.prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
        include: {
          clientPackage: true,
          client: {
            include: {
              user: true,
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
      booking.status ===
      BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Booking already cancelled'
      );
    }

    if (
      booking.status ===
      BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Completed booking cannot be cancelled'
      );
    }

    const now = new Date();
    const isFutureBooking =
      booking.startAt > now;

    return this.prisma.$transaction(async (tx) => {
      if (isFutureBooking) {
        await tx.clientPackage.update({
          where: {
            id: booking.clientPackageId,
          },
          data: {
            remainingSessions:
              booking.clientPackage
                .remainingSessions + 1,
            active: true,
          },
        });
      }

      await this.notifyClient(
        tx,
        booking.client.userId,
        NotificationType.TRAINER_CANCELLED,
        'Session Cancelled',
        `Your trainer cancelled your session scheduled for ${this.formatBelgradeDateTime(booking.startAt)}`
      );

      return tx.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledBy: ActorType.TRAINER,
          cancelledAt: new Date(),
        },
      });
    });
  }

  async reschedule(
    bookingId: string,
    startAtIso: string
  ) {
    const booking =
      await this.prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
        include: {
          client: {
            include: {
              user: true,
            },
          },
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found'
      );
    }

    const oldStartAt = booking.startAt;

    if (
      booking.status ===
      BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cancelled booking cannot be rescheduled'
      );
    }

    if (
      booking.status ===
      BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Completed booking cannot be rescheduled'
      );
    }

    const startAt = new Date(startAtIso);
    const endAt = DateTime.fromJSDate(startAt, {
      zone: 'utc',
    })
      .plus({ hours: 1 })
      .toJSDate();

    await this.validateBookingRules(
      booking.clientId,
      startAt,
      booking.id
    );

    return this.prisma.$transaction(
      async (tx) => {
        await this.notifyClient(
          tx,
          booking.client.userId,
          NotificationType.TRAINER_RESCHEDULED,
          'Session Rescheduled',
          `Your trainer moved your session from ${this.formatBelgradeDateTime(oldStartAt)} to ${this.formatBelgradeDateTime(startAt)}`
        );

        return tx.booking.update({
          where: {
            id: bookingId,
          },
          data: {
            startAt,
            endAt,
            status: BookingStatus.RESCHEDULED,
          },
        });
      }
    );
  }

  async findAll() {
    return this.prisma.booking.findMany({
      orderBy: {
        startAt: 'asc',
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
  }

  async assignWorkout(
    bookingId: string,
    trainerId: string,
    workoutTemplateId?: string | null
  ) {
    const booking =
      await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          client: {
            trainerId,
          },
        },
        include: {
          workoutTemplate: true,
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found'
      );
    }

    if (!workoutTemplateId) {
      return this.prisma.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          workoutTemplateId: null,
        },
        include: {
          workoutTemplate: true,
        },
      });
    }

    const workout =
      await this.prisma.workoutTemplate.findFirst({
        where: {
          id: workoutTemplateId,
          trainerId,
        },
      });

    if (!workout) {
      throw new NotFoundException(
        'Workout not found'
      );
    }

    const existingBookings =
      await this.prisma.booking.findMany({
        where: {
          id: {
            not: booking.id,
          },
          startAt: booking.startAt,
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.RESCHEDULED,
            ],
          },
        },
        include: {
          workoutTemplate: true,
        },
      });

    const herculesCount =
      existingBookings.filter(
        (b) =>
          b.workoutTemplate?.type ===
          'HERCULES'
      ).length;

    const reformerCount =
      existingBookings.filter(
        (b) =>
          b.workoutTemplate?.type ===
          'REFORMER'
      ).length;

    if (
      workout.type === 'HERCULES' &&
      herculesCount >= 1
    ) {
      throw new BadRequestException(
        'Only 1 Hercules workout allowed in this slot'
      );
    }

    if (
      workout.type === 'REFORMER' &&
      reformerCount >= 4
    ) {
      throw new BadRequestException(
        'Maximum 4 Reformer workouts allowed in this slot'
      );
    }

    return this.prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        workoutTemplateId,
      },
      include: {
        workoutTemplate: true,
      },
    });
  }

  private async notifyClient(
    tx: Prisma.TransactionClient,
    userId: string,
    type: NotificationType,
    title: string,
    message: string
  ) {
    await tx.notification.create({
      data: {
        userId,
        type,
        title,
        message,
      },
    });
  }

  async approveLateReschedule(
    bookingId: string
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const booking =
          await tx.booking.findUnique({
            where: {
              id: bookingId,
            },
            include: {
              client: {
                include: {
                  user: true,
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
          booking.status !==
          BookingStatus.PENDING_APPROVAL
        ) {
          throw new BadRequestException(
            'Booking is not pending approval'
          );
        }

        if (
          !booking.requestedStartAt ||
          !booking.requestedEndAt
        ) {
          throw new BadRequestException(
            'Missing requested session data'
          );
        }

        const updatedBooking =
          await tx.booking.update({
            where: {
              id: booking.id,
            },
            data: {
              startAt:
                booking.requestedStartAt,
              endAt:
                booking.requestedEndAt,
              requestedStartAt: null,
              requestedEndAt: null,
              status:
                BookingStatus.RESCHEDULED,
            },
          });

        await tx.notification.create({
          data: {
            userId:
              booking.client.userId,
            type:
              NotificationType.REQUEST_APPROVED,
            title:
              'Late Session Approved',
            message: `Your trainer approved your 21:00 session request for ${this.formatBelgradeDateTime(booking.requestedStartAt)}`,
          },
        });

        return updatedBooking;
      }
    );
  }

  async rejectLateReschedule(
    bookingId: string
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const booking =
          await tx.booking.findUnique({
            where: {
              id: bookingId,
            },
            include: {
              client: true,
            },
          });

        if (!booking) {
          throw new NotFoundException(
            'Booking not found'
          );
        }

        await tx.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            requestedStartAt: null,
            requestedEndAt: null,
            status:
              BookingStatus.CONFIRMED,
          },
        });

        await tx.notification.create({
          data: {
            userId:
              booking.client.userId,
            type:
              NotificationType.REQUEST_REJECTED,
            title:
              'Late Session Rejected',
            message:
              'Your trainer rejected your 21:00 session request',
          },
        });

        return {
          success: true,
        };
      }
    );
  }

  async saveWorkoutLog(
    bookingId: string,
    dto: SaveWorkoutLogDto,
  ) {
    const booking =
      await this.prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
      });

    if (!booking) {
      throw new NotFoundException(
        'Booking not found'
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const workoutLog =
          await tx.workoutLog.upsert({
            where: {
              bookingId,
            },
            update: {
              notes: dto.notes,
            },
            create: {
              bookingId,
              notes: dto.notes,
            },
          });

        await tx.exerciseLog.deleteMany({
          where: {
            workoutLogId: workoutLog.id,
          },
        });

        if (dto.exercises.length > 0) {
          await tx.exerciseLog.createMany({
            data: dto.exercises
              .filter(
                (e) =>
                  e.weight ||
                  e.reps ||
                  e.notes
              )
              .map((e) => ({
                workoutLogId: workoutLog.id,
                name: e.name,
                weight: e.weight,
                reps: e.reps,
                notes: e.notes,
              })),
          });
        }

        return workoutLog;
      }
    );
  }
}