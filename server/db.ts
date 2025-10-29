// Reference: blueprint:javascript_database
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Otimização para free tier do Neon: reduzir pipelining para minimizar uso de recursos
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuração otimizada do Connection Pool para Neon free tier + Render free tier
// Estas configurações reduzem drasticamente o tempo de conexão e evitam timeouts
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  
  // Limitar conexões simultâneas para free tier do Neon (máx 3 conexões)
  max: 3,
  
  // Tempo máximo que uma conexão pode existir (5 minutos)
  // Neon free tier pode encerrar conexões idle, então rotacionamos frequentemente
  maxUses: 50,
  
  // Tempo máximo de espera para obter conexão do pool (10 segundos)
  connectionTimeoutMillis: 10000,
  
  // Tempo que uma conexão pode ficar idle antes de ser fechada (30 segundos)
  // Reduzido para liberar recursos rapidamente no free tier
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
