import { Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import { neonConfig } from '@neondatabase/serverless';
import * as schema from "./shared/schema";

neonConfig.webSocketConstructor = ws;

const NEON_URL = process.env.DATABASE_URL;
const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD;

if (!NEON_URL) {
  throw new Error('DATABASE_URL não encontrada nas variáveis de ambiente');
}

if (!SUPABASE_PASSWORD) {
  throw new Error('SUPABASE_PASSWORD não encontrada nas variáveis de ambiente');
}

// Encode password for URL (handle special characters like #)
const encodedPassword = encodeURIComponent(SUPABASE_PASSWORD);
const SUPABASE_URL = `postgresql://postgres.wxagguvpbkegwjeqthge:${encodedPassword}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;

async function migrateData() {
  console.log('🔄 Iniciando migração de dados do Neon para Supabase...\n');

  // Conectar aos dois bancos (Neon com driver serverless, Supabase com pg)
  const neonPool = new NeonPool({ connectionString: NEON_URL });
  const supabasePool = new PgPool({ 
    connectionString: SUPABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const neonDb = drizzleNeon({ client: neonPool, schema });
  const supabaseDb = drizzlePg({ client: supabasePool, schema });

  try {
    // 1. Exportar dados do Neon
    console.log('📤 Exportando dados do Neon...');
    const users = await neonDb.select().from(schema.users);
    const properties = await neonDb.select().from(schema.properties);
    const contracts = await neonDb.select().from(schema.contracts);
    const visits = await neonDb.select().from(schema.visits);
    const proposals = await neonDb.select().from(schema.proposals);
    const payments = await neonDb.select().from(schema.payments);
    const notifications = await neonDb.select().from(schema.notifications);
    const virtualTours = await neonDb.select().from(schema.virtualTours);
    const tourRooms = await neonDb.select().from(schema.tourRooms);
    const tourHotspots = await neonDb.select().from(schema.tourHotspots);
    const advertisements = await neonDb.select().from(schema.advertisements);

    console.log(`✓ Dados exportados:`);
    console.log(`  - ${users.length} usuários`);
    console.log(`  - ${properties.length} propriedades`);
    console.log(`  - ${contracts.length} contratos`);
    console.log(`  - ${visits.length} visitas`);
    console.log(`  - ${proposals.length} propostas`);
    console.log(`  - ${payments.length} pagamentos`);
    console.log(`  - ${notifications.length} notificações`);
    console.log(`  - ${virtualTours.length} tours virtuais`);
    console.log(`  - ${tourRooms.length} salas de tours`);
    console.log(`  - ${tourHotspots.length} hotspots de tours`);
    console.log(`  - ${advertisements.length} anúncios\n`);

    // 2. Limpar tabelas no Supabase (na ordem inversa das dependências)
    console.log('🗑️  Limpando tabelas no Supabase...');
    await supabasePool.query('TRUNCATE TABLE tour_hotspots CASCADE');
    await supabasePool.query('TRUNCATE TABLE tour_rooms CASCADE');
    await supabasePool.query('TRUNCATE TABLE virtual_tours CASCADE');
    await supabasePool.query('TRUNCATE TABLE advertisements CASCADE');
    await supabasePool.query('TRUNCATE TABLE notifications CASCADE');
    await supabasePool.query('TRUNCATE TABLE payments CASCADE');
    await supabasePool.query('TRUNCATE TABLE proposals CASCADE');
    await supabasePool.query('TRUNCATE TABLE visits CASCADE');
    await supabasePool.query('TRUNCATE TABLE contracts CASCADE');
    await supabasePool.query('TRUNCATE TABLE properties CASCADE');
    await supabasePool.query('TRUNCATE TABLE users CASCADE');
    console.log('✓ Tabelas limpas\n');

    // 3. Importar dados para Supabase (na ordem das dependências)
    console.log('📥 Importando dados para Supabase...');

    if (users.length > 0) {
      await supabaseDb.insert(schema.users).values(users);
      console.log(`✓ ${users.length} usuários importados`);
    }

    if (properties.length > 0) {
      await supabaseDb.insert(schema.properties).values(properties);
      console.log(`✓ ${properties.length} propriedades importadas`);
    }

    if (contracts.length > 0) {
      await supabaseDb.insert(schema.contracts).values(contracts);
      console.log(`✓ ${contracts.length} contratos importados`);
    }

    if (visits.length > 0) {
      await supabaseDb.insert(schema.visits).values(visits);
      console.log(`✓ ${visits.length} visitas importadas`);
    }

    if (proposals.length > 0) {
      await supabaseDb.insert(schema.proposals).values(proposals);
      console.log(`✓ ${proposals.length} propostas importadas`);
    }

    if (payments.length > 0) {
      await supabaseDb.insert(schema.payments).values(payments);
      console.log(`✓ ${payments.length} pagamentos importados`);
    }

    if (notifications.length > 0) {
      await supabaseDb.insert(schema.notifications).values(notifications);
      console.log(`✓ ${notifications.length} notificações importadas`);
    }

    if (virtualTours.length > 0) {
      await supabaseDb.insert(schema.virtualTours).values(virtualTours);
      console.log(`✓ ${virtualTours.length} tours virtuais importados`);
    }

    if (tourRooms.length > 0) {
      await supabaseDb.insert(schema.tourRooms).values(tourRooms);
      console.log(`✓ ${tourRooms.length} salas de tours importadas`);
    }

    if (tourHotspots.length > 0) {
      await supabaseDb.insert(schema.tourHotspots).values(tourHotspots);
      console.log(`✓ ${tourHotspots.length} hotspots de tours importados`);
    }

    if (advertisements.length > 0) {
      await supabaseDb.insert(schema.advertisements).values(advertisements);
      console.log(`✓ ${advertisements.length} anúncios importados`);
    }

    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await neonPool.end();
    await supabasePool.end();
  }
}

migrateData();
