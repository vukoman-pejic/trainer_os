import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
      PrismaModule,
      AuthModule,
      UsersModule,
      ClientsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
