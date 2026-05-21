import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.deleteMany({
    where: { email: { contains: '.test@' } }
  });
  console.log('Usuarios eliminados:', result.count);
}
main().finally(() => prisma.$disconnect());
