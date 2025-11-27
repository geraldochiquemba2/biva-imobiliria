// Reference: blueprint:javascript_database
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please add it to your environment variables.",
  );
}

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  
  max: 10,
  min: 4,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 300000,
  maxLifetimeSeconds: 1800,
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000,
});

// Função para pré-aquecer o pool de conexões no startup
export async function warmupPool(): Promise<void> {
  console.log('[DB Pool] Iniciando warm-up das conexões...');
  const startTime = Date.now();
  
  try {
    // Criar múltiplas conexões em paralelo para aquecer o pool
    const warmupPromises = [];
    for (let i = 0; i < 4; i++) {
      warmupPromises.push(
        pool.query('SELECT 1 as warmup').catch(err => {
          console.error(`[DB Pool] Erro no warm-up ${i}:`, err.message);
        })
      );
    }
    
    await Promise.all(warmupPromises);
    
    const duration = Date.now() - startTime;
    console.log(`[DB Pool] Warm-up concluído em ${duration}ms - Pool pronto com ${pool.totalCount} conexões`);
  } catch (error) {
    console.error('[DB Pool] Erro durante warm-up:', error);
  }
}

// Event listeners para monitoramento e debugging
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Pool] Nova conexão estabelecida');
  }
});

pool.on('acquire', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Pool] Conexão adquirida do pool');
  }
});

pool.on('error', (err, client) => {
  console.error('[DB Pool] Erro inesperado na conexão:', err);
});

pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB Pool] Conexão removida do pool');
  }
});

// Log de estatísticas do pool em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log(`[Pool Stats] Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
  }, 60000); // A cada minuto
}

// Graceful shutdown do pool
process.on('SIGTERM', async () => {
  console.log('[DB Pool] Encerrando conexões do pool...');
  await pool.end();
  console.log('[DB Pool] Pool encerrado com sucesso');
});

process.on('SIGINT', async () => {
  console.log('[DB Pool] Encerrando conexões do pool...');
  await pool.end();
  console.log('[DB Pool] Pool encerrado com sucesso');
  process.exit(0);
});

export const db = drizzle({ client: pool, schema });
