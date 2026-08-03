import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function upsertUser(
  email: string,
  name: string,
  role: 'USER' | 'TECHNICIEN' | 'ADMIN',
) {
  const password = await bcrypt.hash('changeme', 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, password },
  });
}

async function main() {
  const admin = await upsertUser('admin@taskforge.local', 'Admin', 'ADMIN');
  const technicien = await upsertUser(
    'technicien@taskforge.local',
    'Technicien Test',
    'TECHNICIEN',
  );
  const user = await upsertUser(
    'user@taskforge.local',
    'Utilisateur Test',
    'USER',
  );

  console.log({ admin: admin.email, technicien: technicien.email, user: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
