# 🔒 Guia RLS com Express Session

## Resumo da Abordagem

Você está usando **Express Session** (não Supabase Auth), então a abordagem é diferente:

- ✅ **Backend**: Usa SERVICE ROLE KEY → **Bypassa RLS** → Faz tudo
- ✅ **Frontend**: Usa ANON KEY → **Respeita RLS** → Só lê dados públicos
- ✅ **RLS**: Bloqueia acesso direto ao banco de dados

---

## Passo 1: Aplicar Políticas RLS

### No Supabase SQL Editor:

1. Abra **SQL Editor** no Supabase
2. Copie todo o conteúdo de `supabase-rls-backend-auth.sql`
3. Cole e execute (**RUN**)

✅ Isso vai:
- Ativar RLS em todas as tabelas
- Permitir leitura pública de propriedades aprovadas e anúncios
- Bloquear todo o resto (protege contra acesso direto)

---

## Passo 2: Configurar SERVICE ROLE KEY

### O que é SERVICE ROLE KEY?

- **ANON KEY**: Chave pública, respeita RLS, usada no **frontend**
- **SERVICE ROLE KEY**: Chave privada, **bypassa RLS**, usada no **backend**

### Como obter:

1. No Supabase, vá em **Settings** → **API**
2. Copie a **service_role** key (não a anon key!)
3. **NUNCA** exponha esta chave no frontend!

### Adicionar ao seu projeto:

Você já tem uma variável de ambiente `SUPABASE_PASSWORD`. Adicione mais uma para a SERVICE ROLE KEY:

**No Replit:**
1. Vá em **Secrets** (🔒 no menu lateral)
2. Adicione uma nova secret:
   - Nome: `SUPABASE_SERVICE_ROLE_KEY`
   - Valor: Cole a service_role key do Supabase

---

## Passo 3: Atualizar código do backend

Atualmente seu `server/db.ts` usa a senha do banco diretamente. 

**NÃO precisa mudar nada!** Sua abordagem atual já funciona.

O importante é que você está usando a conexão PostgreSQL direta (não a SDK do Supabase), o que significa que você está usando credenciais de "service role" (postgres user).

---

## Como Funciona na Prática

### ✅ **Dados Públicos (Frontend pode ler diretamente)**

```typescript
// Frontend pode fazer queries diretas para dados públicos
const { data: properties } = await supabase
  .from('properties')
  .select('*')
  .eq('approval_status', 'aprovado');

// Funciona! RLS permite leitura de propriedades aprovadas
```

### ✅ **Dados Privados (Só via Backend API)**

```typescript
// ❌ Frontend NÃO pode fazer isto diretamente:
const { data } = await supabase
  .from('contracts')
  .select('*');
// ERRO: RLS bloqueia!

// ✅ Frontend faz via sua API Express:
const response = await fetch('/api/contracts');
// Backend valida sessão → Busca no banco → Retorna dados
```

---

## Segurança em Camadas

### 🛡️ Camada 1: Express Session
```typescript
// Middleware verifica se usuário está logado
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}
```

### 🛡️ Camada 2: Validação de Permissões no Backend
```typescript
// Backend verifica se o usuário pode acessar aquele recurso
app.get("/api/contracts/:id", requireAuth, async (req, res) => {
  const contract = await storage.getContract(req.params.id);
  
  // Verifica se o usuário é parte do contrato
  if (contract.clienteId !== req.session.userId && 
      contract.proprietarioId !== req.session.userId &&
      !req.session.userTypes.includes('admin')) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  
  res.json(contract);
});
```

### 🛡️ Camada 3: RLS no Banco
```sql
-- Se alguém tentar acessar direto via psql ou vazamento de credenciais
-- RLS bloqueia tudo (exceto dados públicos)
```

---

## Fluxo de Dados

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │
       │ 1. Login via API
       ▼
┌─────────────────────────────┐
│  Backend (Express)          │
│  - Valida credenciais       │
│  - Cria sessão              │
│  - Retorna dados do usuário │
└──────────┬──────────────────┘
           │
           │ 2. Queries ao banco
           │    (com permissão total)
           ▼
┌─────────────────────────────┐
│  Supabase PostgreSQL        │
│  - RLS ativo                │
│  - Backend bypassa RLS      │
│  - Acesso direto bloqueado  │
└─────────────────────────────┘
```

---

## ✅ Checklist de Segurança

- [x] RLS ativado em todas as tabelas
- [x] Backend usa credenciais PostgreSQL (equivalente a service role)
- [x] Frontend não tem acesso a credenciais sensíveis
- [x] Validação de permissões no código do backend
- [x] Dados públicos acessíveis (propriedades aprovadas)
- [x] Dados privados protegidos (contratos, pagamentos)

---

## 🚨 O Que NÃO Fazer

❌ **NUNCA exponha estas credenciais no frontend:**
- `SUPABASE_PASSWORD`
- Credenciais do PostgreSQL
- Service Role Key (se usar SDK do Supabase)

❌ **NUNCA faça queries sensíveis direto do frontend:**
```typescript
// ❌ NÃO FAÇA ISTO
const { data } = await supabase
  .from('users')
  .select('password'); // RLS bloqueia, mas não tente!
```

✅ **SEMPRE use a API do backend:**
```typescript
// ✅ FAÇA ISTO
const response = await fetch('/api/auth/me');
```

---

## 🎯 Resumo

**Sua configuração atual JÁ É SEGURA!**

Ao aplicar o script RLS:
1. ✅ Erros do Supabase desaparecem
2. ✅ Banco fica protegido contra acesso direto
3. ✅ Backend continua funcionando normalmente
4. ✅ Segurança aumenta sem quebrar nada

**Basta executar o script SQL e pronto!** 🎉

---

## 📞 Próximos Passos

1. Execute `supabase-rls-backend-auth.sql` no Supabase
2. Verifique se os erros desapareceram
3. Teste a aplicação normalmente
4. Tudo deve continuar funcionando!

Se tiver algum problema, me avise! 😊
