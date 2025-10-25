# Deploy no Render - Guia Completo

## Opção 1: Deploy Automático (Recomendado)

### 1. Preparar o Repositório Git
```bash
# Se ainda não tem Git configurado
git init
git add .
git commit -m "Preparar para deploy no Render"
```

### 2. Enviar para GitHub/GitLab
1. Crie um repositório no GitHub ou GitLab
2. Conecte e envie o código:
```bash
git remote add origin SEU_REPOSITORIO_URL
git branch -M main
git push -u origin main
```

### 3. Deploy no Render

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **"New +"** → **"Blueprint"**
3. Conecte seu repositório GitHub/GitLab
4. O Render vai detectar o arquivo `render.yaml` automaticamente
5. Clique em **"Apply"**

O Render vai criar automaticamente:
- ✅ Web Service (sua aplicação)
- ✅ PostgreSQL Database (base de dados)
- ✅ Variáveis de ambiente configuradas

---

## Opção 2: Deploy Manual

### 1. Criar a Base de Dados PostgreSQL

1. No [dashboard do Render](https://dashboard.render.com)
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** biva-db
   - **Database:** biva
   - **User:** biva
   - **Region:** Oregon (ou mais próximo de você)
   - **Plan:** Free
4. Clique em **"Create Database"**
5. **Copie a "Internal Database URL"** (você vai precisar)

### 2. Criar o Web Service

1. Clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub/GitLab
3. Configure:

   **Básico:**
   - **Name:** biva-imobiliaria
   - **Region:** Oregon (mesma da base de dados)
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

   **Plano:**
   - **Instance Type:** Free

4. Clique em **"Advanced"** e adicione as variáveis de ambiente:

   **Environment Variables:**
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (Cole a Internal Database URL copiada)

5. Clique em **"Create Web Service"**

### 3. Migrar o Schema da Base de Dados

Depois do primeiro deploy:

1. No dashboard do Render, acesse seu **Web Service**
2. Vá para a aba **"Shell"**
3. Execute:
```bash
npm run db:push
```

---

## Usar sua Base de Dados Neon Existente

Se quiser continuar usando a base de dados Neon que já tem configurada:

1. No Render, crie apenas o **Web Service** (pule a criação da base de dados)
2. Configure a variável de ambiente:
   - `DATABASE_URL` = `postgresql://neondb_owner:npg_3uFLaT5ZiCXv@ep-green-art-a4f06x8d-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

**Vantagens:**
- ✅ Seus dados existentes já estão lá
- ✅ Não precisa migrar dados
- ✅ Continua usando o plano que já tem

---

## Verificar o Deploy

Após o deploy:

1. Acesse a URL fornecida pelo Render (ex: `https://biva-imobiliaria.onrender.com`)
2. Faça login com o usuário admin:
   - **Telefone:** +244912345678
   - **Senha:** 123456789

---

## Troubleshooting

### "Build failed"
- Verifique se o `package.json` tem todos os scripts necessários
- Certifique-se que todas as dependências estão no `dependencies` (não em `devDependencies`)

### "Application Error"
- Verifique os logs na aba **"Logs"** do Render
- Confirme que a variável `DATABASE_URL` está configurada corretamente

### "Database connection error"
- Certifique-se que usou a **Internal Database URL** (não a External)
- Verifique se o schema foi migrado com `npm run db:push`

---

## Notas Importantes

⚠️ **Plano Free do Render:**
- O serviço entra em "sleep" após 15 minutos de inatividade
- O primeiro acesso pode demorar 30-60 segundos para "acordar"
- A base de dados PostgreSQL free tem limite de 256MB

💡 **Para produção séria:**
- Considere o plano pago para melhor performance
- Ou use sua base de dados Neon (que oferece melhor plano free)

---

## Atualizar a Aplicação

Sempre que fizer mudanças no código:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

O Render vai detectar automaticamente e fazer redeploy!
