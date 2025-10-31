# 🔒 Guia de Políticas RLS - Supabase

## O que você precisa fazer

### Passo 1: Acessar o Supabase
1. Entre no seu projeto no [Supabase](https://supabase.com)
2. Vá em **SQL Editor** no menu lateral

### Passo 2: Executar o Script
1. Abra o arquivo `supabase-rls-policies.sql` deste projeto
2. Copie **todo** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)

⚠️ **IMPORTANTE**: Execute o script completo de uma vez só!

---

## O que as políticas fazem

### 🔐 Sistema de Segurança

As políticas RLS criam **regras de acesso** para cada tabela. Veja o que cada uma protege:

### 1️⃣ **Tabela `users` (Usuários)**
- ✅ Cada usuário **vê apenas seus próprios dados**
- ✅ Admins **veem todos os usuários**
- ✅ Qualquer pessoa pode se **registrar** (criar conta)
- ❌ Usuários **não podem editar** dados de outros

### 2️⃣ **Tabela `properties` (Propriedades)**
- ✅ **Todos** podem ver propriedades aprovadas
- ✅ Proprietários veem **todas as suas propriedades** (inclusive pendentes/recusadas)
- ✅ Proprietários podem **criar e editar** suas propriedades
- ✅ Admins veem e editam **tudo**
- ❌ Clientes **não podem editar** propriedades de outros

### 3️⃣ **Tabela `contracts` (Contratos)**
- ✅ Apenas o **proprietário** e o **cliente** do contrato podem ver
- ✅ Ambas as partes podem **assinar** o contrato
- ✅ Admins podem ver **todos os contratos**
- ❌ Terceiros **não têm acesso**

### 4️⃣ **Tabela `visits` (Visitas)**
- ✅ Cliente vê **suas visitas agendadas**
- ✅ Proprietário vê **visitas de suas propriedades**
- ✅ Cliente pode **solicitar visitas**
- ✅ Proprietário pode **responder/confirmar**
- ❌ Outros usuários **não veem** as visitas

### 5️⃣ **Tabela `proposals` (Propostas)**
- ✅ Cliente vê **suas propostas enviadas**
- ✅ Proprietário vê **propostas de suas propriedades**
- ✅ Cliente pode **fazer propostas**
- ✅ Proprietário pode **aceitar ou recusar**
- ❌ Outros usuários **não veem** as propostas

### 6️⃣ **Tabela `payments` (Pagamentos)**
- ✅ Apenas **proprietário** e **cliente** do contrato veem os pagamentos
- ✅ Ambos podem **atualizar status**
- ✅ Admins veem **tudo**
- ❌ Terceiros **não têm acesso**

### 7️⃣ **Tabela `notifications` (Notificações)**
- ✅ Usuário vê **apenas suas notificações**
- ✅ Usuário pode **marcar como lida**
- ✅ Usuário pode **deletar** suas notificações
- ❌ Não pode ver notificações de outros

### 8️⃣ **Tabelas de Tours Virtuais**
(`virtual_tours`, `tour_rooms`, `tour_hotspots`)
- ✅ **Todos** podem ver tours de propriedades aprovadas
- ✅ Proprietário pode **criar/editar/deletar** tours de suas propriedades
- ✅ Admins podem **gerenciar tudo**

### 9️⃣ **Tabela `advertisements` (Anúncios)**
- ✅ **Todos** podem ver anúncios ativos
- ✅ Apenas **admins** podem criar, editar ou deletar anúncios
- ❌ Usuários comuns **não podem criar** anúncios

---

## 🛡️ Como funciona a proteção

### Função Especial: `is_admin()`
O script cria uma função que verifica se o usuário atual é administrador:
```sql
-- Verifica se o usuário tem 'admin' em user_types
```

### Tipos de Políticas Criadas

1. **SELECT** (Visualizar) - Quem pode ver os dados
2. **INSERT** (Criar) - Quem pode adicionar novos registros
3. **UPDATE** (Atualizar) - Quem pode modificar dados existentes
4. **DELETE** (Deletar) - Quem pode remover dados

---

## ✅ Como verificar se funcionou

Após executar o script, execute esta consulta no SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'properties', 'contracts', 'visits', 'proposals', 
  'payments', 'notifications', 'virtual_tours', 'tour_rooms', 
  'tour_hotspots', 'advertisements'
);
```

**Resultado esperado**: Todas as tabelas devem mostrar `rowsecurity = true` (ou `t`)

---

## 🚨 IMPORTANTE - Autenticação no Frontend

Para que o RLS funcione, você **PRECISA** usar a autenticação do Supabase no seu frontend.

### Como configurar:

1. **Instale o cliente Supabase:**
```bash
npm install @supabase/supabase-js
```

2. **Configure no seu código:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'SUA_URL_SUPABASE'
const supabaseKey = 'SUA_CHAVE_PUBLICA'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

3. **Faça login:**
```typescript
// O RLS usa auth.uid() para identificar o usuário
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@exemplo.com',
  password: 'senha123'
})
```

⚠️ **ATENÇÃO**: Se você **não** estiver usando a autenticação do Supabase (usando sessões Express, por exemplo), as políticas RLS **não funcionarão corretamente** porque `auth.uid()` retornará `null`.

---

## 🔧 Problemas Comuns

### ❌ Erro: "new row violates row-level security policy"
**Causa**: Você está tentando inserir/atualizar dados sem permissão  
**Solução**: Verifique se o usuário está autenticado e tem os user_types corretos

### ❌ Não consigo ver nenhum dado
**Causa**: auth.uid() está retornando null  
**Solução**: Certifique-se de que está usando a autenticação do Supabase

### ❌ Admin não consegue ver tudo
**Causa**: O usuário não tem 'admin' no array user_types  
**Solução**: 
```sql
UPDATE users 
SET user_types = array_append(user_types, 'admin') 
WHERE id = 'ID_DO_USUARIO';
```

---

## 📝 Resumo de Segurança

✅ **Antes**: Qualquer pessoa com acesso ao banco podia ler/modificar TUDO  
✅ **Depois**: Cada usuário vê e modifica **apenas seus próprios dados**  
✅ **Admins**: Têm acesso completo para gerenciar a plataforma  
✅ **Público**: Pode ver apenas propriedades aprovadas e anúncios ativos  

---

## 💡 Dicas Finais

1. **Teste bastante** após aplicar as políticas
2. **Crie um usuário admin** de teste
3. **Documente** quais usuários devem ser admins
4. **Monitore** os logs do Supabase para identificar problemas de acesso

---

## 🆘 Precisa de ajuda?

Se algo não funcionar, verifique:
- [ ] O script foi executado sem erros?
- [ ] Todas as tabelas têm `rowsecurity = true`?
- [ ] Você está usando autenticação do Supabase?
- [ ] O usuário tem os user_types corretos?

---

**Criado para proteger seu sistema imobiliário** 🏠🔒
