import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from "./shared/schema";

const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD;

if (!SUPABASE_PASSWORD) {
  throw new Error('SUPABASE_PASSWORD não encontrada nas variáveis de ambiente');
}

const encodedPassword = encodeURIComponent(SUPABASE_PASSWORD);
const SUPABASE_URL = `postgresql://postgres:${encodedPassword}@db.wxagguvpbkegwjeqthge.supabase.co:5432/postgres`;

async function applySchema() {
  console.log('🔧 Aplicando schema no Supabase...\n');

  const pool = new Pool({ 
    connectionString: SUPABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  const db = drizzle({ client: pool, schema });

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Schema aplicado com sucesso no Supabase!');
  } catch (error) {
    console.error('❌ Erro ao aplicar schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

applySchema();
