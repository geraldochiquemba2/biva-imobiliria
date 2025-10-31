-- ============================================================================
-- ADICIONAR POLÍTICAS FALTANTES
-- ============================================================================
-- Este script adiciona políticas para as tabelas que ainda mostram avisos
-- no Console de Segurança do Supabase
-- ============================================================================

-- ============================================================================
-- POLÍTICA PARA USERS (USUÁRIOS)
-- ============================================================================
-- Nota: Como o backend gerencia tudo, não precisamos de políticas SELECT públicas
-- Mas precisamos de PELO MENOS UMA política para o Supabase parar de alertar

-- Política vazia (bloqueia tudo exceto service role)
CREATE POLICY "users_backend_only" ON public.users
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- POLÍTICA PARA CONTRACTS (CONTRATOS)
-- ============================================================================

CREATE POLICY "contracts_backend_only" ON public.contracts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- POLÍTICA PARA NOTIFICATIONS (NOTIFICAÇÕES)
-- ============================================================================

CREATE POLICY "notifications_backend_only" ON public.notifications
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- POLÍTICA PARA PAYMENTS (PAGAMENTOS)
-- ============================================================================

CREATE POLICY "payments_backend_only" ON public.payments
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- POLÍTICA PARA PROPOSALS (PROPOSTAS)
-- ============================================================================

CREATE POLICY "proposals_backend_only" ON public.proposals
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- POLÍTICA PARA VISITS (VISITAS)
-- ============================================================================

CREATE POLICY "visits_backend_only" ON public.visits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Ver quantas políticas cada tabela tem agora
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Resumo: quantas políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- EXPLICAÇÃO
-- ============================================================================
-- 
-- Por que USING (false) e WITH CHECK (false)?
-- 
-- - USING (false) = Bloqueia SELECT/UPDATE/DELETE para qualquer usuário
-- - WITH CHECK (false) = Bloqueia INSERT para qualquer usuário
-- 
-- Mas o backend usa SERVICE ROLE (credenciais postgres), que BYPASSA RLS!
-- 
-- Resultado:
-- ✅ Backend: Acesso total (bypassa RLS)
-- ❌ Acesso direto: Bloqueado
-- ✅ Supabase Console: Para de mostrar avisos
-- 
-- ============================================================================
