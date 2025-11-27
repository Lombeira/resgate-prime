#!/bin/bash

# ==========================================
# Script de Setup do Neon para Resgate Prime
# ==========================================

set -e

echo "🚀 Setup Neon PostgreSQL para Resgate Prime"
echo ""

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm não encontrado. Instale com: npm i -g pnpm"
    exit 1
fi

# Verificar se .env.local existe
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local não encontrado!"
    echo ""
    echo "📝 Criando .env.local..."
    
    cat > .env.local << 'EOF'
# NEON DATABASE
DATABASE_URL="postgresql://[user]:[password]@ep-[id].us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10"
DIRECT_DATABASE_URL="postgresql://[user]:[password]@ep-[id].us-east-2.aws.neon.tech/neondb?sslmode=require"

# PROVIDER
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
PROVIDER_API_KEY=""
PROVIDER_API_SECRET=""

# SEGURANÇA (gere com: openssl rand -hex 32)
WEBHOOK_SECRET=""
INTERNAL_API_SECRET=""

# WALLET
USDT_WALLET_ADDRESS=""
USDT_NETWORK="TRC20"

# OPCIONAL
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
SLACK_WEBHOOK_URL=""
ALERT_EMAIL=""

# CONFIG
ENABLE_AUTO_WITHDRAW="true"
MIN_DONATION_BRL="10"
MAX_DONATION_BRL="50000"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="60000"
NODE_ENV="development"
EOF

    echo "✅ .env.local criado!"
    echo ""
    echo "⚠️  IMPORTANTE: Edite .env.local e adicione suas credenciais Neon:"
    echo "   1. Acesse https://console.neon.tech"
    echo "   2. Copie as connection strings (Pooled e Direct)"
    echo "   3. Cole em .env.local"
    echo ""
    read -p "Pressione ENTER após configurar .env.local..."
fi

echo ""
echo "📦 Instalando dependências..."
pnpm install

echo ""
echo "🔧 Gerando Prisma Client..."
pnpm db:generate

echo ""
echo "🗄️  Verificando conexão com Neon..."
if pnpm prisma db pull --force 2>/dev/null; then
    echo "✅ Conexão com Neon OK!"
else
    echo "⚠️  Não foi possível conectar ao Neon."
    echo "   Verifique DATABASE_URL em .env.local"
    exit 1
fi

echo ""
echo "📊 Aplicando schema no Neon..."
pnpm db:push --accept-data-loss

echo ""
echo "🎉 Setup concluído com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure o provedor (Mercado Bitcoin/Parfin) em .env.local"
echo "   2. Configure sua wallet USDT em .env.local"
echo "   3. Execute: pnpm dev"
echo "   4. Acesse: http://localhost:3000"
echo ""
echo "💡 Dica: Execute 'pnpm db:studio' para visualizar o banco de dados"
echo ""

