import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [
      PrismaModule,
      AuthModule,
      UsersModule,
      ClientsModule,
      PackagesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
