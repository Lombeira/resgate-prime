# 🚀 Guia de Setup Rápido - Resgate Prime

Este guia te leva de **zero a produção** em ~30 minutos.

## ✅ Checklist Pré-Deploy

- [ ] Node.js 18+ instalado
- [ ] Conta GitHub criada
- [ ] Conta Vercel criada e conectada ao GitHub
- [ ] Conta em provedor (Mercado Bitcoin / Parfin)
- [ ] Database PostgreSQL provisionado (Supabase/PlanetScale/Neon)
- [ ] Upstash Redis criado (opcional)
- [ ] Wallet USDT criada (TRC20)

## 📝 Passo a Passo

### 1️⃣ Clone e Instale (5 min)

```bash
# Clone
git clone <seu-repo>
cd resgate-prime

# Instale
npm install

# Copie env
cp .env.example .env.local
```

### 2️⃣ Configure Database (10 min)

#### Opção A: Supabase (recomendado)

1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Copie `DATABASE_URL` de Settings → Database → Connection String
4. Cole em `.env.local`

#### Opção B: PlanetScale

1. Acesse [planetscale.com](https://planetscale.com)
2. Crie database
3. Copie connection string
4. Cole em `.env.local`

```bash
# Execute migrations
npm run db:push

# Verifique
npm run db:studio
```

### 3️⃣ Configure Provedor (15 min)

#### Mercado Bitcoin

1. Criar conta PJ: https://www.mercadobitcoin.com.br
2. Completar KYC empresarial (3-5 dias úteis)
3. Solicitar API Pro na dashboard
4. Gerar API Key e Secret

Cole em `.env.local`:

```bash
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
PROVIDER_API_KEY="sua_key"
PROVIDER_API_SECRET="seu_secret"
```

### 4️⃣ Configure Segurança (2 min)

```bash
# Gere secrets fortes
openssl rand -hex 32  # Use para WEBHOOK_SECRET
openssl rand -hex 32  # Use para INTERNAL_API_SECRET
```

Cole em `.env.local`:

```bash
WEBHOOK_SECRET="secret_gerado_1"
INTERNAL_API_SECRET="secret_gerado_2"
```

### 5️⃣ Configure Wallet (1 min)

**TRC20 (recomendado)**:

1. Crie wallet no [TronLink](https://www.tronlink.org/)
2. Copie endereço (começa com `T`)
3. Cole em `.env.local`:

```bash
USDT_WALLET_ADDRESS="TXyz..."
USDT_NETWORK="TRC20"
```

### 6️⃣ Configure Redis (5 min - opcional)

1. Acesse [upstash.com](https://upstash.com)
2. Crie database Redis
3. Copie REST URL e Token
4. Cole em `.env.local`:

```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 7️⃣ Teste Local (2 min)

```bash
# Start
npm run dev

# Em outro terminal, teste
curl http://localhost:3000/api/donations \
  -H "Authorization: Bearer SEU_INTERNAL_API_SECRET"

# Deve retornar: {"donations":[],...}
```

### 8️⃣ Deploy Vercel (5 min)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Na Vercel Dashboard:

1. Settings → Environment Variables
2. Adicione TODAS as variáveis do `.env.local`
3. Salve e redeploy

### 9️⃣ Configure Webhook (2 min)

No painel do provedor:

1. Vá em Webhooks / Notifications
2. Adicione URL: `https://seu-app.vercel.app/api/pix/webhook`
3. Cole `WEBHOOK_SECRET` no campo de assinatura
4. Ative eventos: `pix.received`, `order.filled`, `withdrawal.confirmed`

### 🔟 Teste End-to-End (10 min)

```bash
# 1. Faça PIX teste de R$10 para chave do provedor
#    Use sua própria conta para testar

# 2. Monitore logs na Vercel
vercel logs --follow

# 3. Verifique dashboard
open https://seu-app.vercel.app/dashboard

# 4. Confirme USDT na wallet
# TronScan: https://tronscan.org/#/address/SEU_ENDERECO
```

## 🎉 Pronto!

Seu sistema está funcionando! Agora:

### Próximos Passos

1. **Configure alertas** via Slack/Email
2. **Habilite Sentry** para error tracking
3. **Configure domínio customizado** na Vercel
4. **Implemente autenticação** no dashboard (JWT/Auth0)
5. **Configure multisig wallet** para valores altos

### Monitoramento

- Vercel Logs: `vercel logs --follow`
- Database: Supabase Dashboard ou `npm run db:studio`
- Redis: Upstash Dashboard
- Wallet: https://tronscan.org (TRC20)

## 🚨 Troubleshooting

### "Cannot connect to database"
→ Verifique `DATABASE_URL` e permissões de rede

### "Webhook signature invalid"
→ Confirme que `WEBHOOK_SECRET` é o mesmo no provedor

### "Provider API error"
→ Verifique API Key/Secret e limites de taxa

### "Withdrawal failed"
→ Confirme formato do endereço e rede correta

## 📞 Precisa de Ajuda?

1. Consulte o [README.md](./README.md) completo
2. Verifique logs: `vercel logs`
3. Abra issue no GitHub

---

**Tempo total: ~30 minutos** ⏱️

Boa sorte! 🚀

