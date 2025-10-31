-- ============================================================================
-- VERIFICAR NOMES DAS TABELAS NO SUPABASE
-- ============================================================================
-- Execute este script primeiro para descobrir os nomes exatos das tabelas
-- ============================================================================

-- Listar todas as tabelas no schema public
SELECT 
  tablename as "Nome da Tabela",
  schemaname as "Schema"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar especificamente as tabelas do seu sistema
SELECT 
  tablename,
  CASE 
    WHEN tablename LIKE '%user%' THEN '👤 Usuários'
    WHEN tablename LIKE '%propert%' THEN '🏠 Propriedades'
    WHEN tablename LIKE '%contract%' OR tablename LIKE '%contrat%' THEN '📝 Contratos'
    WHEN tablename LIKE '%visit%' THEN '📅 Visitas'
    WHEN tablename LIKE '%proposal%' OR tablename LIKE '%propost%' THEN '💰 Propostas'
    WHEN tablename LIKE '%payment%' OR tablename LIKE '%pagament%' THEN '💳 Pagamentos'
    WHEN tablename LIKE '%notif%' THEN '🔔 Notificações'
    WHEN tablename LIKE '%tour%' THEN '🎥 Tours'
    WHEN tablename LIKE '%advert%' OR tablename LIKE '%anunc%' THEN '📢 Anúncios'
    ELSE '❓ Outra'
  END as tipo,
  rowsecurity as rls_ativo
FROM pg_tables 
WHERE schemaname = 'public'
AND (
  tablename LIKE '%user%' OR
  tablename LIKE '%propert%' OR
  tablename LIKE '%contract%' OR tablename LIKE '%contrat%' OR
  tablename LIKE '%visit%' OR
  tablename LIKE '%proposal%' OR tablename LIKE '%propost%' OR
  tablename LIKE '%payment%' OR tablename LIKE '%pagament%' OR
  tablename LIKE '%notif%' OR
  tablename LIKE '%tour%' OR
  tablename LIKE '%advert%' OR tablename LIKE '%anunc%'
)
ORDER BY tablename;
