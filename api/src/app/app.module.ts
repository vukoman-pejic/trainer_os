import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';
import { PackagesModule } from '../packages/packages.module';
import { BookingsModule } from '../bookings/bookings.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { WorkoutsModule } from '../workouts/workouts.module';
import { ClientModule } from '../client/client.module';

@Module({
  imports: [
      PrismaModule,
      AuthModule,
      UsersModule,
      ClientsModule,
      PackagesModule,
      BookingsModule,
      DashboardModule,
      WorkoutsModule,
      ClientModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
