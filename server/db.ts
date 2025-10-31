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
  
  // Tempo máximo de espera para obter conexão do pool (10 segundos)
  connectionTimeoutMillis: 10000,
  
  // Tempo que uma conexão pode ficar idle antes de ser fechada (30 segundos)
  idleTimeoutMillis: 30000,
  
  // Verificar conexão está viva antes de usar
  allowExitOnIdle: true,
});

// Log de estatísticas do pool em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log(`[Pool Stats] Total: ${pool.totalCount}, Idle: ${pool.idleCount}, Waiting: ${pool.waitingCount}`);
  }, 60000); // A cada minuto
}

export const db = drizzle({ client: pool, schema });
