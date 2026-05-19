import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async getPackages() {
    return this.prisma.package.findMany({
      where: {
        active: true,
      },
      orderBy: {
        sessionCount: 'asc',
      },
    });
  }

  async assignPackage(
    clientId: string,
    packageId: string
  ) {
    const client =
      await this.prisma.clientProfile.findUnique({
        where: {
          id: clientId,
        },
      });

    if (!client) {
      throw new NotFoundException(
        'Client not found'
      );
    }

    const existingPackage =
      await this.prisma.clientPackage.findFirst({
        where: {
          clientId,
          active: true,
        },
      });

    if (existingPackage) {
      throw new BadRequestException(
        'Client already has an active package'
      );
    }

    const packageEntity =
      await this.prisma.package.findUnique({
        where: {
          id: packageId,
        },
      });

    if (!packageEntity || !packageEntity.active) {
      throw new NotFoundException(
        'Package not found'
      );
    }

    return this.prisma.clientPackage.create({
      data: {
        clientId,
        packageId,
        remainingSessions:
          packageEntity.sessionCount,
        paymentStatus:
          PaymentStatus.UNPAID,
        active: true,
      },
    });
  }

  async updatePayment(
    clientPackageId: string,
    paymentStatus: PaymentStatus
  ) {
    const clientPackage =
      await this.prisma.clientPackage.findUnique({
        where: {
          id: clientPackageId,
        },
      });

    if (!clientPackage) {
      throw new NotFoundException(
        'Client package not found'
      );
    }

    return this.prisma.clientPackage.update({
      where: {
        id: clientPackageId,
      },
      data: {
        paymentStatus,
      },
    });
  }
}