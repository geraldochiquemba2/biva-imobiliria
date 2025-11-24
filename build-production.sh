#!/bin/bash

echo "🏗️  Iniciando build de produção..."
echo ""

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist/public

# Build do cliente
echo "📦 Compilando frontend..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
  echo "✅ Frontend compilado com sucesso!"
  echo ""
  echo "✨ Build de produção concluído!"
  echo ""
  echo "📊 Estatísticas do build:"
  du -sh dist/public 2>/dev/null || echo "Build criado"
  echo ""
  echo "✅ Pronto para deploy no Render!"
else
  echo "❌ Erro ao compilar frontend"
  exit 1
fi
