import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertTrainer(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.upsert({
    where: {
      email: data.email,
    },
    update: {},
    create: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: UserRole.TRAINER,
    },
  });
}

async function main() {
  const trainer1Password =
    process.env.SEED_TRAINER_1_PASSWORD;

  const trainer2Password =
    process.env.SEED_TRAINER_2_PASSWORD;

  const trainer3Password =
    process.env.SEED_TRAINER_3_PASSWORD;

  if (!trainer1Password || !trainer2Password || !trainer3Password) {
    throw new Error(
      'Missing trainer seed passwords in environment variables'
    );
  }

  const trainer1 = await upsertTrainer({
    email: 'sasajovanovic998@gmail.com',
    password: trainer1Password,
    firstName: 'Sasa',
    lastName: 'Jovanovic',
    phone: '0612031119',
  });

  const trainer2 = await upsertTrainer({
    email: 'vukasin.bunjevac@gmail.com',
    password: trainer2Password,
    firstName: 'Vukasin',
    lastName: 'Bunjevac',
    phone: '0691338861',
  });

  const trainer3 = await upsertTrainer({
    email: 'vukpejic4@gmail.com',
    password: trainer3Password,
    firstName: 'Vukoman',
    lastName: 'Pejic',
    phone: '0600660206',
  });

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

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: {
        name: pkg.name,
      },
      update: {
        sessionCount: pkg.sessionCount,
      },
      create: pkg,
    });
  }

  console.log('Seed complete');
  console.log('Trainer 1:', trainer1.email);
  console.log('Trainer 2:', trainer2.email);
  console.log('Trainer 3:', trainer3.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });