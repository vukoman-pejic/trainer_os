import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActorType, BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

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
      8, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22,
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

    const dayStart = new Date(startAt);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(startAt);
    dayEnd.setHours(23, 59, 59, 999);

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
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 1);

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
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 1);

    await this.validateBookingRules(
      booking.clientId,
      startAt,
      booking.id
    );

    return this.prisma.booking.update({
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
}