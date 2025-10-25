# Guia de Deployment - BIVA Imobiliária

## Configuração do Neon PostgreSQL

### 1. Atualizar a variável DATABASE_URL no Replit

Vá em **Secrets** (cadeado no menu lateral) e atualize:

```
DATABASE_URL=postgresql://neondb_owner:npg_3uFLaT5ZiCXv@ep-green-art-a4f06x8d-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. Fazer Push do Schema para o Neon

No terminal do Replit, execute:

```bash
npm run db:push
```

Este comando irá criar todas as tabelas no banco Neon PostgreSQL.

### 3. Verificar as Tabelas

Você pode verificar se as tabelas foram criadas acessando o painel do Neon ou executando:

```bash
npm run db:studio
```

## Deployment no Render

### 1. Criar Web Service no Render

1. Acesse [render.com](https://render.com)
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório GitHub/GitLab
4. Configure:
   - **Name**: biva-imobiliaria
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Region**: escolha a mais próxima

### 2. Configurar Variáveis de Ambiente no Render

No painel do Render, adicione as seguintes variáveis:

```
DATABASE_URL=postgresql://neondb_owner:npg_3uFLaT5ZiCXv@ep-green-art-a4f06x8d-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NODE_ENV=production

SESSION_SECRET=seu-secret-aqui-minimo-32-caracteres

RENDER_EXTERNAL_URL=https://seu-app.onrender.com
```

**IMPORTANTE**: Substitua `https://seu-app.onrender.com` pela URL real do seu app no Render após o primeiro deploy.

### 3. Sistema Keep-Alive Automático

O sistema já está configurado para manter o servidor ativo:

- ✅ Endpoint `/api/health` criado
- ✅ Auto-ping a cada 14 minutos em produção
- ✅ Previne hibernação automática do Render

O sistema só funciona em produção quando `RENDER_EXTERNAL_URL` está configurado.

### 4. Deploy

1. Faça commit e push das alterações para seu repositório
2. O Render detectará automaticamente e iniciará o build
3. Aguarde o deploy completar
4. Acesse a URL fornecida pelo Render

## Verificação

### Testar Health Check

```bash
curl https://seu-app.onrender.com/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T12:00:00.000Z"
}
```

### Verificar Keep-Alive

Nos logs do Render, você deve ver a cada 14 minutos:
```
Keep-alive ping successful
```

## Troubleshooting

### App ainda hiberna

1. Verifique se `RENDER_EXTERNAL_URL` está configurado corretamente
2. Verifique se `NODE_ENV=production`
3. Confira os logs do Render para ver se há erros no keep-alive

### Erro de conexão com banco

1. Verifique se o `DATABASE_URL` está correto
2. Confirme que o IP do Render está permitido no Neon (geralmente público por padrão)
3. Teste a conexão: `npm run db:push`

### Sessões não persistem

1. Certifique-se que `SESSION_SECRET` está configurado
2. Verifique se o cookie está com `secure: true` em produção

## Comandos Úteis

```bash
# Push schema para o banco
npm run db:push

# Abrir Drizzle Studio
npm run db:studio

# Ver logs em tempo real no Render
# (use o dashboard web do Render)

# Rebuild forçado
# Settings > Manual Deploy > Deploy latest commit
```

## Estrutura do Banco de Dados

O schema está definido em `shared/schema.ts` com as seguintes tabelas:

- **users** - Usuários do sistema
- **properties** - Imóveis cadastrados
- **contracts** - Contratos de venda/arrendamento
- **visits** - Visitas agendadas
- **proposals** - Propostas de negociação
- **payments** - Pagamentos realizados

## Backup e Manutenção

### Backup Automático (Neon)

O Neon faz backup automático. Para configurar:
1. Acesse o painel do Neon
2. Vá em **Settings** → **Backups**
3. Configure a retenção desejada

### Migração de Dados

Se precisar migrar dados do banco antigo:

```bash
# 1. Exportar do banco antigo (se tiver acesso)
pg_dump OLD_DATABASE_URL > backup.sql

# 2. Importar para o Neon
psql DATABASE_URL < backup.sql
```

## Suporte

Em caso de problemas:
- Logs do Render: Dashboard → Logs
- Logs do Neon: Dashboard → Monitoring
- Verificar variáveis de ambiente
