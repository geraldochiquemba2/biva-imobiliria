// Reference: blueprint:javascript_database
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Construir a URL do Supabase usando a senha da variável de ambiente
const SUPABASE_PASSWORD = process.env.SUPABASE_PASSWORD;

if (!SUPABASE_PASSWORD) {
  throw new Error(
    "SUPABASE_PASSWORD must be set. Please add it to your environment variables.",
  );
}

// Encode password para URL (lidar com caracteres especiais)
const encodedPassword = encodeURIComponent(SUPABASE_PASSWORD);
const DATABASE_URL = `postgresql://postgres.wxagguvpbkegwjeqthge:${encodedPassword}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`;

// Configuração otimizada do Connection Pool para Supabase
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  
  // SSL é obrigatório para Supabase
  ssl: {
    rejectUnauthorized: false
  },
  
  // Limitar conexões simultâneas (Supabase free tier suporta até 15 conexões)
  max: 10,
  
  // Conexões mínimas mantidas ativas (keep-alive)
  min: 2,
  
  // Tempo máximo de espera para obter conexão do pool (10 segundos)
  connectionTimeoutMillis: 10000,
  
  // Tempo que uma conexão pode ficar idle antes de ser fechada (2 minutos)
  idleTimeoutMillis: 120000,
  
  // Tempo máximo de vida de uma conexão (30 minutos)
  maxLifetimeSeconds: 1800,
  
  // Verificar conexão está viva antes de usar
  allowExitOnIdle: true,
  
  // Keep-alive configuration para manter conexões ativas
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  
  // Statement timeout (evitar queries muito longas)
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
