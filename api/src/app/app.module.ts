import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';
import { PackagesModule } from '../packages/packages.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
      PrismaModule,
      AuthModule,
      UsersModule,
      ClientsModule,
      PackagesModule,
      BookingsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
