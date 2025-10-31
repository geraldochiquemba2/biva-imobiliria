-- ============================================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY) PARA O SUPABASE
-- ============================================================================
-- Este arquivo contém todas as políticas de segurança necessárias para
-- proteger os dados do sistema imobiliário.
-- 
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
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
-- 2. FUNÇÃO AUXILIAR PARA VERIFICAR SE O USUÁRIO É ADMIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()::text 
    AND 'admin' = ANY(user_types)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. POLÍTICAS PARA A TABELA USERS
-- ============================================================================

-- Usuários podem ver seus próprios dados
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  USING (id = auth.uid()::text);

-- Admins podem ver todos os usuários
CREATE POLICY "users_select_admin" ON public.users
  FOR SELECT
  USING (is_admin());

-- Usuários podem atualizar seus próprios dados (exceto user_types e status)
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (id = auth.uid()::text);

-- Admins podem atualizar qualquer usuário
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE
  USING (is_admin());

-- Permitir inserção de novos usuários (registro público)
CREATE POLICY "users_insert_public" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 4. POLÍTICAS PARA A TABELA PROPERTIES
-- ============================================================================

-- Todos podem ver propriedades aprovadas e disponíveis
CREATE POLICY "properties_select_public" ON public.properties
  FOR SELECT
  USING (approval_status = 'aprovado');

-- Proprietários podem ver suas próprias propriedades (qualquer status)
CREATE POLICY "properties_select_owner" ON public.properties
  FOR SELECT
  USING (owner_id = auth.uid()::text);

-- Admins podem ver todas as propriedades
CREATE POLICY "properties_select_admin" ON public.properties
  FOR SELECT
  USING (is_admin());

-- Proprietários podem inserir propriedades
CREATE POLICY "properties_insert_owner" ON public.properties
  FOR INSERT
  WITH CHECK (owner_id = auth.uid()::text);

-- Proprietários podem atualizar suas próprias propriedades
CREATE POLICY "properties_update_owner" ON public.properties
  FOR UPDATE
  USING (owner_id = auth.uid()::text);

-- Admins podem atualizar qualquer propriedade
CREATE POLICY "properties_update_admin" ON public.properties
  FOR UPDATE
  USING (is_admin());

-- Admins podem deletar propriedades
CREATE POLICY "properties_delete_admin" ON public.properties
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- 5. POLÍTICAS PARA A TABELA CONTRACTS
-- ============================================================================

-- Proprietário pode ver seus contratos
CREATE POLICY "contracts_select_proprietario" ON public.contracts
  FOR SELECT
  USING (proprietario_id = auth.uid()::text);

-- Cliente pode ver seus contratos
CREATE POLICY "contracts_select_cliente" ON public.contracts
  FOR SELECT
  USING (cliente_id = auth.uid()::text);

-- Admins podem ver todos os contratos
CREATE POLICY "contracts_select_admin" ON public.contracts
  FOR SELECT
  USING (is_admin());

-- Sistema pode inserir contratos (via backend)
CREATE POLICY "contracts_insert" ON public.contracts
  FOR INSERT
  WITH CHECK (
    proprietario_id = auth.uid()::text OR 
    cliente_id = auth.uid()::text OR
    is_admin()
  );

-- Proprietário e cliente podem atualizar seus contratos (assinaturas)
CREATE POLICY "contracts_update" ON public.contracts
  FOR UPDATE
  USING (
    proprietario_id = auth.uid()::text OR 
    cliente_id = auth.uid()::text OR
    is_admin()
  );

-- ============================================================================
-- 6. POLÍTICAS PARA A TABELA VISITS
-- ============================================================================

-- Cliente pode ver suas visitas
CREATE POLICY "visits_select_cliente" ON public.visits
  FOR SELECT
  USING (cliente_id = auth.uid()::text);

-- Proprietário pode ver visitas de suas propriedades
CREATE POLICY "visits_select_owner" ON public.visits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = visits.property_id 
      AND properties.owner_id = auth.uid()::text
    )
  );

-- Admins podem ver todas as visitas
CREATE POLICY "visits_select_admin" ON public.visits
  FOR SELECT
  USING (is_admin());

-- Clientes podem criar visitas
CREATE POLICY "visits_insert_cliente" ON public.visits
  FOR INSERT
  WITH CHECK (cliente_id = auth.uid()::text);

-- Cliente e proprietário podem atualizar visitas
CREATE POLICY "visits_update" ON public.visits
  FOR UPDATE
  USING (
    cliente_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = visits.property_id 
      AND properties.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- ============================================================================
-- 7. POLÍTICAS PARA A TABELA PROPOSALS
-- ============================================================================

-- Cliente pode ver suas propostas
CREATE POLICY "proposals_select_cliente" ON public.proposals
  FOR SELECT
  USING (cliente_id = auth.uid()::text);

-- Proprietário pode ver propostas de suas propriedades
CREATE POLICY "proposals_select_owner" ON public.proposals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = proposals.property_id 
      AND properties.owner_id = auth.uid()::text
    )
  );

-- Admins podem ver todas as propostas
CREATE POLICY "proposals_select_admin" ON public.proposals
  FOR SELECT
  USING (is_admin());

-- Clientes podem criar propostas
CREATE POLICY "proposals_insert_cliente" ON public.proposals
  FOR INSERT
  WITH CHECK (cliente_id = auth.uid()::text);

-- Proprietário pode atualizar status da proposta
CREATE POLICY "proposals_update_owner" ON public.proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = proposals.property_id 
      AND properties.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- ============================================================================
-- 8. POLÍTICAS PARA A TABELA PAYMENTS
-- ============================================================================

-- Proprietário do contrato pode ver pagamentos
CREATE POLICY "payments_select_proprietario" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE contracts.id = payments.contract_id 
      AND contracts.proprietario_id = auth.uid()::text
    )
  );

-- Cliente do contrato pode ver pagamentos
CREATE POLICY "payments_select_cliente" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE contracts.id = payments.contract_id 
      AND contracts.cliente_id = auth.uid()::text
    )
  );

-- Admins podem ver todos os pagamentos
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT
  USING (is_admin());

-- Sistema pode inserir pagamentos
CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE contracts.id = payments.contract_id 
      AND (
        contracts.proprietario_id = auth.uid()::text OR 
        contracts.cliente_id = auth.uid()::text
      )
    ) OR
    is_admin()
  );

-- Partes do contrato podem atualizar pagamentos
CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE contracts.id = payments.contract_id 
      AND (
        contracts.proprietario_id = auth.uid()::text OR 
        contracts.cliente_id = auth.uid()::text
      )
    ) OR
    is_admin()
  );

-- ============================================================================
-- 9. POLÍTICAS PARA A TABELA NOTIFICATIONS
-- ============================================================================

-- Usuários podem ver apenas suas próprias notificações
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Sistema pode inserir notificações
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Usuários podem atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Usuários podem deletar suas próprias notificações
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- ============================================================================
-- 10. POLÍTICAS PARA A TABELA VIRTUAL_TOURS
-- ============================================================================

-- Todos podem ver tours de propriedades aprovadas
CREATE POLICY "virtual_tours_select_public" ON public.virtual_tours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = virtual_tours.property_id 
      AND properties.approval_status = 'aprovado'
    )
  );

-- Proprietário pode ver tours de suas propriedades
CREATE POLICY "virtual_tours_select_owner" ON public.virtual_tours
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = virtual_tours.property_id 
      AND properties.owner_id = auth.uid()::text
    )
  );

-- Admins podem ver todos os tours
CREATE POLICY "virtual_tours_select_admin" ON public.virtual_tours
  FOR SELECT
  USING (is_admin());

-- Proprietário pode criar tours para suas propriedades
CREATE POLICY "virtual_tours_insert_owner" ON public.virtual_tours
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = virtual_tours.property_id 
      AND properties.owner_id = auth.uid()::text
    )
  );

-- Proprietário pode atualizar tours de suas propriedades
CREATE POLICY "virtual_tours_update_owner" ON public.virtual_tours
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = virtual_tours.property_id 
      AND properties.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- Proprietário pode deletar tours de suas propriedades
CREATE POLICY "virtual_tours_delete_owner" ON public.virtual_tours
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = virtual_tours.property_id 
      AND properties.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- ============================================================================
-- 11. POLÍTICAS PARA A TABELA TOUR_ROOMS
-- ============================================================================

-- Todos podem ver rooms de tours públicos
CREATE POLICY "tour_rooms_select_public" ON public.tour_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_tours vt
      JOIN public.properties p ON p.id = vt.property_id
      WHERE vt.id = tour_rooms.tour_id 
      AND p.approval_status = 'aprovado'
    )
  );

-- Proprietário pode ver rooms de seus tours
CREATE POLICY "tour_rooms_select_owner" ON public.tour_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_tours vt
      JOIN public.properties p ON p.id = vt.property_id
      WHERE vt.id = tour_rooms.tour_id 
      AND p.owner_id = auth.uid()::text
    )
  );

-- Admins podem ver todos os rooms
CREATE POLICY "tour_rooms_select_admin" ON public.tour_rooms
  FOR SELECT
  USING (is_admin());

-- Proprietário pode criar rooms
CREATE POLICY "tour_rooms_insert_owner" ON public.tour_rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.virtual_tours vt
      JOIN public.properties p ON p.id = vt.property_id
      WHERE vt.id = tour_rooms.tour_id 
      AND p.owner_id = auth.uid()::text
    )
  );

-- Proprietário pode atualizar rooms
CREATE POLICY "tour_rooms_update_owner" ON public.tour_rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_tours vt
      JOIN public.properties p ON p.id = vt.property_id
      WHERE vt.id = tour_rooms.tour_id 
      AND p.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- Proprietário pode deletar rooms
CREATE POLICY "tour_rooms_delete_owner" ON public.tour_rooms
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.virtual_tours vt
      JOIN public.properties p ON p.id = vt.property_id
      WHERE vt.id = tour_rooms.tour_id 
      AND p.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- ============================================================================
-- 12. POLÍTICAS PARA A TABELA TOUR_HOTSPOTS
-- ============================================================================

-- Todos podem ver hotspots de tours públicos
CREATE POLICY "tour_hotspots_select_public" ON public.tour_hotspots
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

-- Proprietário pode ver hotspots de seus tours
CREATE POLICY "tour_hotspots_select_owner" ON public.tour_hotspots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_rooms tr
      JOIN public.virtual_tours vt ON vt.id = tr.tour_id
      JOIN public.properties p ON p.id = vt.property_id
      WHERE tr.id = tour_hotspots.from_room_id 
      AND p.owner_id = auth.uid()::text
    )
  );

-- Admins podem ver todos os hotspots
CREATE POLICY "tour_hotspots_select_admin" ON public.tour_hotspots
  FOR SELECT
  USING (is_admin());

-- Proprietário pode criar hotspots
CREATE POLICY "tour_hotspots_insert_owner" ON public.tour_hotspots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tour_rooms tr
      JOIN public.virtual_tours vt ON vt.id = tr.tour_id
      JOIN public.properties p ON p.id = vt.property_id
      WHERE tr.id = tour_hotspots.from_room_id 
      AND p.owner_id = auth.uid()::text
    )
  );

-- Proprietário pode atualizar hotspots
CREATE POLICY "tour_hotspots_update_owner" ON public.tour_hotspots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_rooms tr
      JOIN public.virtual_tours vt ON vt.id = tr.tour_id
      JOIN public.properties p ON p.id = vt.property_id
      WHERE tr.id = tour_hotspots.from_room_id 
      AND p.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- Proprietário pode deletar hotspots
CREATE POLICY "tour_hotspots_delete_owner" ON public.tour_hotspots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_rooms tr
      JOIN public.virtual_tours vt ON vt.id = tr.tour_id
      JOIN public.properties p ON p.id = vt.property_id
      WHERE tr.id = tour_hotspots.from_room_id 
      AND p.owner_id = auth.uid()::text
    ) OR
    is_admin()
  );

-- ============================================================================
-- 13. POLÍTICAS PARA A TABELA ADVERTISEMENTS
-- ============================================================================

-- Todos podem ver anúncios ativos
CREATE POLICY "advertisements_select_public" ON public.advertisements
  FOR SELECT
  USING (active = true);

-- Admins podem ver todos os anúncios
CREATE POLICY "advertisements_select_admin" ON public.advertisements
  FOR SELECT
  USING (is_admin());

-- Apenas admins podem inserir anúncios
CREATE POLICY "advertisements_insert_admin" ON public.advertisements
  FOR INSERT
  WITH CHECK (is_admin());

-- Apenas admins podem atualizar anúncios
CREATE POLICY "advertisements_update_admin" ON public.advertisements
  FOR UPDATE
  USING (is_admin());

-- Apenas admins podem deletar anúncios
CREATE POLICY "advertisements_delete_admin" ON public.advertisements
  FOR DELETE
  USING (is_admin());

-- ============================================================================
-- FIM DAS POLÍTICAS RLS
-- ============================================================================

-- Verificar se RLS está ativado em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'properties', 'contracts', 'visits', 'proposals', 
  'payments', 'notifications', 'virtual_tours', 'tour_rooms', 
  'tour_hotspots', 'advertisements'
);
