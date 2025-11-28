# ✅ Pós-Deploy: Verificação e Próximos Passos

## 🎉 Parabéns! Deploy feito!

Agora vamos verificar se está tudo funcionando.

---

## 🔍 Verificação Rápida (5 min)

### 1️⃣ Verificar URL do App

```bash
# Ver deployments
vercel ls

# Ou acesse no navegador:
# https://seu-app.vercel.app
```

**Esperado**: Página inicial carrega sem erros.

---

### 2️⃣ Testar Endpoint de Doações

```bash
curl https://seu-app.vercel.app/api/donations \
  -H "Authorization: Bearer SEU_INTERNAL_API_SECRET"
```

**Esperado**: 
```json
{
  "donations": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  },
  "stats": {
    "totalAmount": "0",
    "totalDonations": 0
  }
}
```

**Se der erro 401**: Verifique se `INTERNAL_API_SECRET` está correto na Vercel.

**Se der erro 500**: Veja logs com `vercel logs --follow`.

---

### 3️⃣ Verificar Logs

```bash
vercel logs --follow
```

**Esperado**: Logs sem erros críticos.

**Se ver erros**:
- `DATABASE_URL not found` → Verifique env vars na Vercel
- `Connection timeout` → Verifique connection string (deve ter `-pooler`)
- `Prisma Client not generated` → Redeploy: `vercel --prod`

---

### 4️⃣ Testar Dashboard

Abra no navegador:
```
https://seu-app.vercel.app/dashboard
```

**Esperado**: Dashboard carrega (mesmo que vazio).

---

## ✅ Checklist Pós-Deploy

- [ ] App acessível em `https://seu-app.vercel.app`
- [ ] Endpoint `/api/donations` responde (com auth)
- [ ] Dashboard carrega
- [ ] Logs sem erros críticos
- [ ] Database conecta (sem erros nos logs)

---

## 🚀 Próximos Passos

### Se TUDO está OK ✅:

**1. Configurar Webhook no Provedor** (5 min)

Se você tem conta no Mercado Bitcoin:

1. Acesse: https://www.mercadobitcoin.com.br
2. **API** → **Webhooks**
3. Adicione:
   - **URL**: `https://seu-app.vercel.app/api/pix/webhook`
   - **Eventos**: Marque "PIX recebido"
   - **Secret**: Cole o `WEBHOOK_SECRET` da Vercel
4. Salvar

**⚠️ IMPORTANTE**: Use o **mesmo** `WEBHOOK_SECRET` que está na Vercel!

---

**2. Obter Chave PIX** (2 min)

No Mercado Bitcoin:

1. **Carteira** → **PIX**
2. Copie sua chave PIX
3. Esta é a chave para onde você vai enviar!

---

**3. Fazer PIX de Teste** (5 min)

1. Abra app do banco
2. **PIX** → **Pagar**
3. Cole a chave PIX do Mercado Bitcoin
4. Valor: **R$ 10,00**
5. Confirmar

**⏱️ Aguarde 2-5 minutos**

---

**4. Acompanhar Processamento**

#### Opção A: Logs

```bash
vercel logs --follow
```

Você verá:
```
📥 Webhook recebido
✅ Doação criada
🔄 Criando ordem de conversão
✅ Ordem criada
💸 Criando withdrawal
✅ USDT enviado!
```

#### Opção B: Dashboard

```
https://seu-app.vercel.app/dashboard
```

Verá doação com status:
- 🟡 PENDING → 🔵 PROCESSING → 🟢 PROCESSED

#### Opção C: Wallet

**TRC20**: https://tronscan.org/#/address/SEU_ENDERECO_PROD

Veja USDT chegando! 🎉

---

## 🐛 Se Algo Não Funcionou

### App não carrega?

```bash
# Verificar deployments
vercel ls

# Ver logs de erro
vercel logs --follow

# Redeploy se necessário
vercel --prod
```

### Erro 401 no endpoint?

1. Verifique `INTERNAL_API_SECRET` na Vercel
2. Use o mesmo secret no header:
   ```bash
   curl ... -H "Authorization: Bearer SEU_SECRET_DA_VERCEL"
   ```

### Erro 500?

1. Veja logs: `vercel logs --follow`
2. Verifique env vars na Vercel
3. Confirme `DATABASE_URL` está correta

### Database não conecta?

1. Verifique `DATABASE_URL` na Vercel
2. Deve ter `?sslmode=require` (sem channel_binding)
3. Deve ter `-pooler` no hostname
4. Teste conexão: `pnpm prisma db pull`

---

## 🎯 Status Atual

Você já tem:
- ✅ Deploy feito
- ✅ App rodando na Vercel
- ✅ Variáveis configuradas

**Falta apenas**:
- ⏳ Configurar webhook no provedor (se tiver conta)
- ⏳ Fazer PIX de teste

---

## 💡 Dica: Teste Sem Provedor

Se ainda não tem conta no provedor, pode testar o webhook:

```bash
# Simular webhook
curl -X POST https://seu-app.vercel.app/api/pix/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test" \
  -H "X-Webhook-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -d '{
    "id": "test-123",
    "type": "pix.received",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "data": {
      "transactionId": "PIX-TEST-123",
      "amountBrl": "50.00",
      "payerName": "Teste",
      "payerDocument": "12345678900"
    }
  }'
```

Isso cria uma doação de teste no banco! (mas não vai converter para USDT sem provedor)

---

## 🎉 Pronto para Produção!

Se tudo está funcionando:

1. ✅ Sistema deployado
2. ✅ Endpoints respondendo
3. ✅ Dashboard acessível
4. ✅ Pronto para receber PIX!

**Próximo**: Configure webhook no provedor e faça seu primeiro PIX! 🚀💰

---

**Dúvidas?** Veja logs: `vercel logs --follow`

