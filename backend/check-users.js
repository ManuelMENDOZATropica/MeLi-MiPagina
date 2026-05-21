import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('Todos los usuarios en BD:', users);
}
main().finally(() => prisma.$disconnect());
