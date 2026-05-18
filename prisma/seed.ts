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

  const packages = [
    { name: '8 Sessions', sessionCount: 8 },
    { name: '12 Sessions', sessionCount: 12 },
    { name: '16 Sessions', sessionCount: 16 },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: {
        name: pkg.name,
      },
      update: {},
      create: pkg,
    });
  }

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