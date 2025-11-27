#!/bin/bash

# ==========================================
# Script para Testar Webhook Localmente
# ==========================================
# Simula um webhook do provedor com PIX recebido

set -e

echo "🧪 Testando webhook local..."
echo ""

# URL do webhook (altere se necessário)
WEBHOOK_URL="${1:-http://localhost:3000/api/pix/webhook}"

# Gerar timestamp atual
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TRANSACTION_ID="PIX-TEST-$(date +%s)"

echo "📝 Dados do teste:"
echo "  URL: $WEBHOOK_URL"
echo "  Transaction ID: $TRANSACTION_ID"
echo "  Timestamp: $TIMESTAMP"
echo ""

# Fazer requisição
response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature-for-development" \
  -H "X-Webhook-Timestamp: $TIMESTAMP" \
  -d "{
    \"id\": \"$TRANSACTION_ID\",
    \"type\": \"pix.received\",
    \"timestamp\": \"$TIMESTAMP\",
    \"data\": {
      \"transactionId\": \"$TRANSACTION_ID\",
      \"amountBrl\": \"50.00\",
      \"payerName\": \"João Teste da Silva\",
      \"payerDocument\": \"12345678900\",
      \"pixKey\": \"teste@example.com\"
    }
  }")

# Extrair código HTTP
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "📡 Resposta do servidor:"
echo "  Status: $http_code"
echo "  Body: $body"
echo ""

# Verificar resultado
if [ "$http_code" = "200" ]; then
  echo "✅ Webhook processado com sucesso!"
  echo ""
  echo "🔍 Próximos passos:"
  echo "  1. Execute: pnpm db:studio"
  echo "  2. Verifique tabela 'Donation'"
  echo "  3. Você deve ver uma doação de R$ 50,00"
  echo ""
elif [ "$http_code" = "401" ]; then
  echo "⚠️  Webhook rejeitado (401 - Não Autorizado)"
  echo ""
  echo "Isso é esperado porque estamos usando assinatura de teste."
  echo ""
  echo "Para teste real:"
  echo "  1. Configure WEBHOOK_SECRET em .env.local"
  echo "  2. Use o provedor real (Mercado Bitcoin/Parfin)"
  echo ""
else
  echo "❌ Erro ao processar webhook (Status: $http_code)"
  echo ""
fi

exit 0

