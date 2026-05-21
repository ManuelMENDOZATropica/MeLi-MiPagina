import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.createMany({
    data: [
      { email: 'maria.test@tropica.me', name: 'María Gómez (Test)', avatar: 'https://i.pravatar.cc/150?img=5' },
      { email: 'carlos.test@tropica.me', name: 'Carlos Ruiz (Test)', avatar: 'https://i.pravatar.cc/150?img=11' },
      { email: 'ana.test@tropica.me', name: 'Ana López (Test)', avatar: 'https://i.pravatar.cc/150?img=9' }
    ],
    skipDuplicates: true
  });
  console.log('Usuarios de prueba creados exitosamente.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
