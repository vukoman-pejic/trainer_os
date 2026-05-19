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

    const allowedHours = [8, 9, 10, 11, 16, 17, 18, 19, 20, 21, 22];

    if (minutes !== 0 || !allowedHours.includes(hour)) {
      throw new BadRequestException('Invalid training slot');
    }
  }

  async create(dto: CreateBookingDto) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt);
    endAt.setHours(endAt.getHours() + 1);

    const now = new Date();

    if (startAt <= now) {
      throw new BadRequestException(
        'Cannot create booking in the past'
      );
    }

    this.validateSlot(startAt);

    const client = await this.prisma.clientProfile.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const activePackage = await this.prisma.clientPackage.findFirst({
      where: {
        clientId: dto.clientId,
        active: true,
      },
    });

    if (!activePackage) {
      throw new BadRequestException('Client has no active package');
    }

    if (activePackage.remainingSessions <= 0) {
      throw new BadRequestException('Client has no remaining sessions');
    }

    const dayStart = new Date(startAt);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(startAt);
    dayEnd.setHours(23, 59, 59, 999);

    const existingClientBooking =
    await this.prisma.booking.findFirst({
        where: {
        clientId: dto.clientId,
        status: BookingStatus.CONFIRMED,
        startAt: {
            gte: dayStart,
            lte: dayEnd,
        },
        },
    });

    if (existingClientBooking) {
        throw new BadRequestException(
            'Client already has a booking for this day'
        );
    }

    const capacity = this.getSlotCapacity(startAt);

    const bookingsCount = await this.prisma.booking.count({
      where: {
        startAt,
        status: BookingStatus.CONFIRMED,
      },
    });

    if (bookingsCount >= capacity) {
      throw new BadRequestException('Selected slot is full');
    }

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
        where: { id: activePackage.id },
        data: {
          remainingSessions: activePackage.remainingSessions - 1,
          active: activePackage.remainingSessions - 1 > 0,
        },
      });

      return booking;
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