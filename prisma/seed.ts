import { PrismaClient, UserRole, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('trainer123', 10);

  const trainer = await prisma.user.upsert({
    where: {
      email: 'trainer@test.com',
    },
    update: {},
    create: {
      email: 'trainer@test.com',
      passwordHash,
      firstName: 'Sasa',
      lastName: 'Jovanovic',
      phone: '0600000000',
      role: UserRole.TRAINER,
    },
  });

  await prisma.booking.deleteMany();
  await prisma.clientPackage.deleteMany();
  await prisma.package.deleteMany();

  const packages = [
    {
      name: '8 Group',
      sessionCount: 8,
    },
    {
      name: '12 Group',
      sessionCount: 12,
    },
    {
      name: '8 Individual',
      sessionCount: 8,
    },
    {
      name: '12 Individual',
      sessionCount: 12,
    },
  ];

  await prisma.package.createMany({
    data: packages,
  });

  console.log('Seed complete');
  console.log('Trainer:', trainer.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });