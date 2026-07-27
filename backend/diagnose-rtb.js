/**
 * Diagnostico: por que los componentes RTB no se guardan.
 *
 *   cd backend
 *   node diagnose-rtb.js
 *
 * Usa el DATABASE_URL del .env, asi que apuntalo a la MISMA base que usa el
 * backend que estas probando (la de Render si estas probando el deploy).
 *
 * Responde tres preguntas:
 *   1. La tabla Project tiene realmente las columnas de RTB?
 *   2. Que hay guardado hoy en esas columnas?
 *   3. Prisma Client puede escribirlas?
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLUMNAS_ESPERADAS = [
  'desktopLayout', 'mobileLayout',
  'rtbDesktopLayout', 'rtbMobileLayout',
  'homeSliderDesktopLayout', 'homeSliderMobileLayout',
];

const linea = (t) => console.log(`\n${'─'.repeat(64)}\n${t}\n${'─'.repeat(64)}`);
const cuenta = (v) => (Array.isArray(v) ? `${v.length} componente(s)` : `NO es array (${typeof v}: ${JSON.stringify(v)?.slice(0, 40)})`);

async function main() {
  console.log('Base:', (process.env.DATABASE_URL || '(sin DATABASE_URL)').replace(/:[^:@]+@/, ':****@'));

  // ── 1. Columnas reales en la base ────────────────────────────────────────
  linea('1. COLUMNAS DE LA TABLA Project EN LA BASE');
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'Project'
    ORDER BY ordinal_position;
  `;
  const nombres = cols.map((c) => c.column_name);
  cols.forEach((c) => console.log(`  ${c.column_name.padEnd(26)} ${c.data_type}`));

  const faltantes = COLUMNAS_ESPERADAS.filter((c) => !nombres.includes(c));
  if (faltantes.length) {
    console.log('\n  ❌ FALTAN COLUMNAS:', faltantes.join(', '));
    console.log('     El schema de Prisma las declara pero la base no las tiene.');
    console.log('     Solucion:  npx prisma db push');
    return;
  }
  console.log('\n  ✅ Estan todas las columnas esperadas.');

  // ── 2. Contenido actual ──────────────────────────────────────────────────
  linea('2. QUE HAY GUARDADO EN CADA PROYECTO');
  const proyectos = await prisma.project.findMany({
    select: {
      id: true, title: true, isPublished: true, slug: true, updatedAt: true,
      desktopLayout: true, mobileLayout: true,
      rtbDesktopLayout: true, rtbMobileLayout: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  if (!proyectos.length) console.log('  (no hay proyectos)');
  for (const p of proyectos) {
    console.log(`\n  ${p.title}  ·  ${p.id}`);
    console.log(`    publicado: ${p.isPublished}   slug: ${p.slug || '(sin slug)'}   ult. cambio: ${p.updatedAt.toISOString()}`);
    console.log(`    miPagina desktop : ${cuenta(p.desktopLayout)}`);
    console.log(`    miPagina mobile  : ${cuenta(p.mobileLayout)}`);
    console.log(`    RTB desktop      : ${cuenta(p.rtbDesktopLayout)}`);
    console.log(`    RTB mobile       : ${cuenta(p.rtbMobileLayout)}`);
  }

  // ── 3. Prueba de escritura real ──────────────────────────────────────────
  linea('3. PRUEBA DE ESCRITURA EN rtbDesktopLayout');
  const objetivo = proyectos[0];
  if (!objetivo) { console.log('  (sin proyectos para probar)'); return; }

  const original = objetivo.rtbDesktopLayout;
  const marca = [{ uniqueId: 'diagnostico-' + Date.now(), type: 'rtb_card', prueba: true }];

  try {
    await prisma.project.update({ where: { id: objetivo.id }, data: { rtbDesktopLayout: marca } });
    const releido = await prisma.project.findUnique({
      where: { id: objetivo.id }, select: { rtbDesktopLayout: true },
    });
    // Postgres jsonb reordena las claves, asi que comparamos normalizando el orden
    const normalizar = (v) => JSON.stringify(v, (_, val) =>
      val && typeof val === 'object' && !Array.isArray(val)
        ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)))
        : val);
    const ok = normalizar(releido.rtbDesktopLayout) === normalizar(marca);
    console.log(ok
      ? '  ✅ Escritura y relectura OK. La base guarda RTB sin problemas.\n     => El problema NO es la base: esta en el backend deployado o en el front.'
      : `  ❌ Se escribio pero volvio distinto: ${JSON.stringify(releido.rtbDesktopLayout)?.slice(0, 120)}`);
  } catch (e) {
    console.log('  ❌ Prisma no pudo escribir rtbDesktopLayout:', e.message.split('\n')[0]);
    console.log('     Solucion probable:  npx prisma generate && npx prisma db push');
  } finally {
    // Siempre devolvemos el valor original
    await prisma.project.update({ where: { id: objetivo.id }, data: { rtbDesktopLayout: original ?? [] } });
    console.log('  (valor original restaurado)');
  }
}

main()
  .catch((e) => { console.error('\nError corriendo el diagnostico:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
