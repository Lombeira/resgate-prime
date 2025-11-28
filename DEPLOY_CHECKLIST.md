# 🚀 Checklist de Deploy - Próximos Passos

## ✅ O que você já fez:

- ✅ Neon Database configurado
- ✅ Prisma schema aplicado
- ✅ Secrets gerados
- ✅ Wallet criada (dev e prod)
- ✅ **Variáveis configuradas na Vercel** ← Você acabou de fazer!

---

## 🎯 Próximos Passos (Ordem):

### 1️⃣ Verificar Deploy (2 min)

```bash
# Se ainda não fez deploy:
vercel --prod

# Verificar se está rodando:
curl https://seu-app.vercel.app
```

Deve retornar HTML da página inicial.

---

### 2️⃣ Testar Endpoints (3 min)

#### Teste 1: Health Check

```bash
curl https://seu-app.vercel.app/api/donations \
  -H "Authorization: Bearer SEU_INTERNAL_API_SECRET"
```

**Esperado**: `{"donations":[],"pagination":{...}}`

#### Teste 2: Verificar Logs

```bash
vercel logs --follow
```

Deve mostrar logs sem erros.

---

### 3️⃣ Configurar Webhook no Provedor (5 min)

**Se você tem conta no Mercado Bitcoin**:

1. Acesse: https://www.mercadobitcoin.com.br
2. Vá em: **API** → **Webhooks**
3. Adicione novo webhook:
   - **URL**: `https://seu-app.vercel.app/api/pix/webhook`
   - **Eventos**: Marque "PIX recebido"
   - **Secret**: Cole o `WEBHOOK_SECRET` que você configurou na Vercel
4. Salvar

**⚠️ IMPORTANTE**: Use o mesmo `WEBHOOK_SECRET` que está na Vercel!

---

### 4️⃣ Obter Chave PIX (2 min)

No Mercado Bitcoin:

1. Vá em: **Carteira** → **PIX**
2. Copie sua chave PIX (email/telefone/aleatória)
3. Esta é a chave para onde você vai enviar o PIX!

---

### 5️⃣ Fazer PIX de Teste (5 min)

1. Abra app do seu banco
2. **PIX** → **Pagar**
3. Cole a chave PIX do Mercado Bitcoin
4. Valor: **R$ 10,00** (mínimo configurado)
5. Confirmar

**⏱️ Aguarde 2-5 minutos**

---

### 6️⃣ Acompanhar Processamento

#### Opção A: Logs da Vercel

```bash
vercel logs --follow
```

Você verá:
```
📥 Webhook recebido
✅ Doação criada
🔄 Criando ordem de conversão
✅ Ordem criada no provedor
💸 Criando withdrawal
✅ USDT enviado!
```

#### Opção B: Dashboard

Abra: `https://seu-app.vercel.app/dashboard`

Verá sua doação com status:
- 🟡 PENDING → Processando
- 🔵 PROCESSING → Convertendo
- 🟢 PROCESSED → Concluído!

#### Opção C: Verificar USDT na Wallet

**TRC20**: https://tronscan.org/#/address/SEU_ENDERECO_PROD

Você verá a transação USDT chegando! 🎉

---

## 📊 Checklist Final de Deploy

Antes de fazer PIX real, confirme:

### Vercel:
- [x] Variáveis de ambiente configuradas
- [ ] Deploy feito (`vercel --prod`)
- [ ] App acessível em `https://seu-app.vercel.app`
- [ ] Logs sem erros

### Provedor (se tiver conta):
- [ ] Webhook configurado
- [ ] Chave PIX obtida
- [ ] Saldo BRL na conta (para conversão)

### Testes:
- [ ] Endpoint `/api/donations` responde
- [ ] Dashboard carrega
- [ ] Logs funcionando

---

## 🐛 Troubleshooting

### App não está acessível?

```bash
# Verificar deploy
vercel ls

# Ver logs de erro
vercel logs --follow
```

### Webhook não funciona?

1. Verifique URL no provedor: `https://seu-app.vercel.app/api/pix/webhook`
2. Confirme `WEBHOOK_SECRET` é o mesmo na Vercel e no provedor
3. Teste manualmente:
   ```bash
   curl -X POST https://seu-app.vercel.app/api/pix/webhook \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Signature: test" \
     -d '{"test": true}'
   ```

### Erro de conexão com banco?

1. Verifique `DATABASE_URL` na Vercel
2. Deve ter `?sslmode=require` (sem channel_binding)
3. Deve ter `-pooler` no hostname

### Ordem não está sendo criada?

1. Verifique `PROVIDER_API_KEY` e `PROVIDER_API_SECRET` na Vercel
2. Confirme saldo BRL na conta do provedor
3. Veja logs: `vercel logs --follow`

---

## 🎉 Sucesso!

Se tudo funcionou:
1. ✅ PIX foi recebido
2. ✅ Ordem BRL→USDT executada
3. ✅ USDT chegou na wallet prod
4. ✅ Dashboard mostra PROCESSED

**Parabéns!** 🎊 Seu sistema está em produção!

---

## 📝 Próximas Melhorias (Opcional)

Depois que estiver funcionando:

1. **Configurar domínio customizado** na Vercel
2. **Adicionar autenticação** no dashboard
3. **Configurar alertas** (Slack/Email)
4. **Implementar GitHub Actions** para cron mais frequente
5. **Adicionar monitoring** (Sentry)

---

**Pronto para fazer o primeiro PIX?** 🚀💰

