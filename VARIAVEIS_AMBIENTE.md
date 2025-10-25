# Variáveis de Ambiente - Guia Completo

## Variáveis Obrigatórias

### 1. `DATABASE_URL`
**O que é:** URL de conexão com a base de dados PostgreSQL

**Formato:**
```
postgresql://usuario:senha@host:porta/database?opcoes
```

**Exemplo (Neon):**
```
postgresql://neondb_owner:npg_3uFLaT5ZiCXv@ep-green-art-a4f06x8d-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Onde configurar:**
- **Render:** Environment → Add Environment Variable
- **Local:** Variável de ambiente do sistema (Replit fornece automaticamente)

---

### 2. `SESSION_SECRET`
**O que é:** Chave secreta para encriptar sessões de usuários (cookies)

**Importante:** 
- ⚠️ NUNCA use a mesma chave em desenvolvimento e produção
- ⚠️ NUNCA compartilhe ou commite esta chave no código
- ✅ Deve ser uma string aleatória longa e segura

**Como gerar:**
```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou use um gerador online seguro
# https://www.lastpass.com/pt/features/password-generator
```

**Exemplo de valor:**
```
Kx8mP2vN9qR4sT6uW0xY1zA3bC5dE7fG8hI0jK2lM4nO6pQ8rS=
```

**Onde configurar:**
- **Render:** Environment → Add Environment Variable
- **Local:** Não precisa (usa valor padrão de desenvolvimento)

---

### 3. `RENDER_EXTERNAL_URL`
**O que é:** URL pública completa do seu site

**Quando usar:** Apenas em produção no Render

**Para que serve:**
- Manter o servidor ativo (evita hibernação após 15 min no plano free)
- Sistema de "keep-alive" automático

**Formato:**
```
https://seu-site.onrender.com
```

**Importante:**
- ⚠️ Só configure DEPOIS do primeiro deploy
- ⚠️ Use a URL completa com `https://`
- ⚠️ Não adicione `/` no final

**Como obter:**
1. Faça o primeiro deploy no Render
2. Copie a URL que aparece no topo do dashboard
3. Volte em Environment e adicione esta variável
4. Save Changes (vai fazer redeploy automático)

**Onde configurar:**
- **Render:** Environment → Add Environment Variable (após primeiro deploy)
- **Local:** Não precisa (não é usado em desenvolvimento)

---

### 4. `NODE_ENV`
**O que é:** Define o ambiente de execução

**Valores possíveis:**
- `development` - Desenvolvimento local
- `production` - Produção (Render)

**Para que serve:**
- Ativa/desativa modo de desenvolvimento
- Define se cookies são seguros (HTTPS)
- Controla logs e otimizações

**Onde configurar:**
- **Render:** Environment → `NODE_ENV` = `production`
- **Local:** Automático (Replit define como `development`)

---

## Resumo Rápido - Render Deploy

**Configurar ANTES do primeiro deploy:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://...sua conexão...
SESSION_SECRET=...sua chave secreta gerada...
```

**Configurar DEPOIS do primeiro deploy:**
```env
RENDER_EXTERNAL_URL=https://seu-site.onrender.com
```

---

## Troubleshooting

### "Session not working" / Não consegue fazer login
- ✅ Verifique se `SESSION_SECRET` está configurado
- ✅ Em produção, certifique-se que está usando HTTPS

### "Site hiberna após 15 minutos"
- ✅ Configure `RENDER_EXTERNAL_URL` após o primeiro deploy
- ✅ Certifique-se que usou a URL completa com `https://`

### "Database connection error"
- ✅ Verifique se `DATABASE_URL` está correto
- ✅ Use a **Internal URL** se estiver usando PostgreSQL do Render
- ✅ Certifique-se que as tabelas foram criadas (`npm run db:push`)

---

## Segurança

### ✅ Boas Práticas
- Use valores diferentes para `SESSION_SECRET` em dev e produção
- Nunca commite valores reais no código
- Gere chaves aleatórias longas (32+ caracteres)
- Use HTTPS em produção (Render fornece automaticamente)

### ❌ Nunca Faça
- Nunca use "123456" ou valores simples como `SESSION_SECRET`
- Nunca compartilhe as credenciais da `DATABASE_URL`
- Nunca commite arquivos `.env` no Git
- Nunca use HTTP em produção para sessões
