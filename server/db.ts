// Reference: blueprint:javascript_database
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Replit's built-in PostgreSQL database
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please ensure the Replit PostgreSQL database is configured.",
  );
}

// Optimized Connection Pool configuration for Replit PostgreSQL
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  
  // Limit simultaneous connections
  max: 10,
  
  // Minimum active connections (keep-alive)
  min: 2,
  
  // Maximum wait time to get connection from pool (10 seconds)
  connectionTimeoutMillis: 10000,
  
  // Time a connection can be idle before being closed (2 minutes)
  idleTimeoutMillis: 120000,
  
  // Maximum connection lifetime (30 minutes)
  maxLifetimeSeconds: 1800,
  
  // Check connection is alive before use
  allowExitOnIdle: true,
  
  // Keep-alive configuration to maintain active connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Statement timeout (avoid very long queries)
  statement_timeout: 30000,
  
  // Query timeout
  query_timeout: 30000,
});

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
