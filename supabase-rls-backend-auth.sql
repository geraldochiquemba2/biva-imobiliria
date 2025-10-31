-- ============================================================================
-- POLÍTICAS RLS PARA BACKEND COM EXPRESS SESSION
-- ============================================================================
-- Esta configuração assume que:
-- 1. O backend usa Express Session (não Supabase Auth)
-- 2. O backend usa SERVICE ROLE KEY (bypassa RLS)
-- 3. RLS serve como proteção contra acesso direto ao banco
-- ============================================================================

-- ============================================================================
-- 1. ATIVAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLÍTICA PADRÃO: NEGAR TUDO
-- ============================================================================
-- Como o backend usa SERVICE ROLE KEY, ele bypassa estas políticas.
-- Estas políticas servem apenas para BLOQUEAR acesso direto ao banco
-- por ferramentas externas ou caso a SERVICE ROLE KEY vaze.
--
-- NÃO criamos políticas permissivas porque:
-- - auth.uid() sempre retorna NULL (não usamos Supabase Auth)
-- - O backend gerencia todas as permissões via código
-- - Queremos bloquear qualquer acesso que não seja via backend
-- ============================================================================

-- ============================================================================
-- TABELAS PÚBLICAS (LEITURA PARA TODOS)
-- ============================================================================
-- Apenas algumas tabelas permitem leitura pública de dados específicos

-- Propriedades aprovadas são públicas (para o frontend mostrar)
CREATE POLICY "properties_public_read" ON public.properties
  FOR SELECT
  USING (approval_status = 'aprovado');

-- Anúncios ativos são públicos
CREATE POLICY "advertisements_public_read" ON public.advertisements
  FOR SELECT
  USING (active = true);

-- Tours de propriedades aprovadas são públicos
CREATE POLICY "virtual_tours_public_read" ON public.virtual_tours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = virtual_tours.property_id 
      AND properties.approval_status = 'aprovado'
    )
  );

-- Rooms de tours públicos são acessíveis
CREATE POLICY "tour_rooms_public_read" ON public.tour_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_tours vt
      JOIN public.properties p ON p.id = vt.property_id
      WHERE vt.id = tour_rooms.tour_id 
      AND p.approval_status = 'aprovado'
    )
  );

-- Hotspots de tours públicos são acessíveis
CREATE POLICY "tour_hotspots_public_read" ON public.tour_hotspots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_rooms tr
      JOIN public.virtual_tours vt ON vt.id = tr.tour_id
      JOIN public.properties p ON p.id = vt.property_id
      WHERE tr.id = tour_hotspots.from_room_id 
      AND p.approval_status = 'aprovado'
    )
  );

-- ============================================================================
-- TODAS AS OUTRAS OPERAÇÕES: BLOQUEADAS
-- ============================================================================
-- Por padrão, com RLS ativado e sem políticas permissivas:
-- - INSERT: bloqueado
-- - UPDATE: bloqueado  
-- - DELETE: bloqueado
-- - SELECT (exceto casos acima): bloqueado
--
-- O backend com SERVICE ROLE KEY bypassa estas restrições.
-- Isso protege contra:
-- - Acesso direto via psql
-- - Acesso via outros clientes SQL
-- - Vazamento de credenciais ANON KEY
-- ============================================================================

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se RLS está ativado em todas as tabelas
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = pt.tablename) as policies_count
FROM pg_tables pt
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'properties', 'contracts', 'visits', 'proposals', 
  'payments', 'notifications', 'virtual_tours', 'tour_rooms', 
  'tour_hotspots', 'advertisements'
)
ORDER BY tablename;

-- ============================================================================
-- IMPORTANTE - LEIA ISTO
-- ============================================================================
-- 
-- ✅ O que este script faz:
-- 1. Ativa RLS em todas as tabelas
-- 2. Permite leitura pública apenas de dados que devem ser públicos
-- 3. Bloqueia todo o resto (INSERT, UPDATE, DELETE, SELECT privado)
--
-- ✅ Como o backend funciona:
-- 1. Backend usa SERVICE ROLE KEY (não ANON KEY)
-- 2. SERVICE ROLE KEY bypassa todas as políticas RLS
-- 3. Backend implementa validação de permissões no código
--
-- ✅ Por que esta abordagem é segura:
-- 1. Acesso direto ao banco está bloqueado
-- 2. Somente o backend (com SERVICE ROLE KEY) pode fazer operações
-- 3. Backend valida permissões antes de cada operação
-- 4. Frontend só lê dados públicos (propriedades aprovadas, anúncios)
--
-- ⚠️ ATENÇÃO:
-- - NUNCA exponha a SERVICE ROLE KEY no frontend
-- - NUNCA commite a SERVICE ROLE KEY no git
-- - Use variável de ambiente para a SERVICE ROLE KEY
--
-- ============================================================================
