import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello() {
    const users = await this.prisma.user.count();

    return {
      message: 'Trainer API running',
      users,
    };
  }
}