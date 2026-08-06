import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Comptes de démonstration, environnement de développement uniquement. Le seed
// écrit directement via Prisma et ne passe donc pas par la validation des DTO :
// les valeurs ci-dessous respectent malgré tout les règles de account-rules.ts
// (pseudo sans espace, mot de passe d'au moins 12 caractères), sans quoi les
// comptes livrés seraient impossibles à recréer via l'API.
const SEED_PASSWORD = 'taskforge-dev-2026';

async function upsertUser(
  email: string,
  name: string,
  role: 'USER' | 'TECHNICIEN' | 'ADMIN',
) {
  const password = await bcrypt.hash(SEED_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    // Rejouer le seed remet les comptes de démo dans un état connu. Sans ça,
    // une base créée avant un changement de règle garde indéfiniment d'anciennes
    // valeurs, et le mot de passe documenté cesse d'être le bon.
    update: { name, role, password },
    create: { email, name, role, password },
  });
}

async function main() {
  const admin = await upsertUser('admin@taskforge.local', 'admin', 'ADMIN');
  const technicien = await upsertUser(
    'technicien@taskforge.local',
    'tech.demo',
    'TECHNICIEN',
  );
  const user = await upsertUser('user@taskforge.local', 'user.demo', 'USER');

  console.log({
    admin: admin.email,
    technicien: technicien.email,
    user: user.email,
    password: SEED_PASSWORD,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
