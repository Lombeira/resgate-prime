# 🚀 Configuração de Produção na Vercel

## 📊 Diferença: Dev vs Prod

| Item | Desenvolvimento | Produção |
|------|----------------|----------|
| **Onde** | `.env.local` | Vercel Dashboard |
| **Quando** | `pnpm dev` | `vercel --prod` |
| **Acesso** | Apenas você | Servidor Vercel |
| **Segurança** | Local | Cloud (criptografado) |

---

## ✅ Passo a Passo: Configurar Produção

### 1️⃣ Preparar Variáveis

Antes de fazer deploy, tenha todas as variáveis prontas:

```bash
# Copie do seu .env.local:
DATABASE_URL="..."
PROVIDER_API_KEY="..."
PROVIDER_API_SECRET="..."
WEBHOOK_SECRET="..."
INTERNAL_API_SECRET="..."
USDT_WALLET_ADDRESS="..."
USDT_NETWORK="TRC20"
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
ENABLE_AUTO_WITHDRAW="true"
MIN_DONATION_BRL="10"
MAX_DONATION_BRL="50000"
NODE_ENV="production"
```

**⚠️ IMPORTANTE**: 
- Use a **mesma** `DATABASE_URL` do Neon (pooled)
- Use os **mesmos** secrets (ou gere novos só para prod)
- Wallet pode ser a mesma ou diferente

---

### 2️⃣ Método 1: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. **Settings** → **Environment Variables**
4. Para cada variável:
   - Clique **Add New**
   - **Key**: Nome da variável (ex: `DATABASE_URL`)
   - **Value**: Cole o valor
   - **Environments**: Marque todos (Production, Preview, Development)
   - **Save**

**Ordem recomendada**:
1. `DATABASE_URL`
2. `PROVIDER_API_KEY`
3. `PROVIDER_API_SECRET`
4. `WEBHOOK_SECRET`
5. `INTERNAL_API_SECRET`
6. `USDT_WALLET_ADDRESS`
7. `USDT_NETWORK`
8. Resto das configs

---

### 3️⃣ Método 2: Via CLI (Mais Rápido)

```bash
# 1. Fazer deploy primeiro
vercel --prod

# 2. Adicionar variáveis uma por uma
vercel env add DATABASE_URL production
# Cole o valor quando pedir

vercel env add PROVIDER_API_KEY production
vercel env add PROVIDER_API_SECRET production
vercel env add WEBHOOK_SECRET production
vercel env add INTERNAL_API_SECRET production
vercel env add USDT_WALLET_ADDRESS production
vercel env add USDT_NETWORK production
# ... e assim por diante
```

---

### 4️⃣ Método 3: Via Arquivo (Bulk)

```bash
# 1. Crie .env.production (NÃO commite no Git!)
cat > .env.production << 'EOF'
DATABASE_URL="sua_url_aqui"
PROVIDER_API_KEY="sua_key"
PROVIDER_API_SECRET="seu_secret"
WEBHOOK_SECRET="seu_secret"
INTERNAL_API_SECRET="seu_secret"
USDT_WALLET_ADDRESS="seu_endereco"
USDT_NETWORK="TRC20"
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
ENABLE_AUTO_WITHDRAW="true"
MIN_DONATION_BRL="10"
MAX_DONATION_BRL="50000"
NODE_ENV="production"
EOF

# 2. Push para Vercel
vercel env push .env.production production
```

**⚠️ CUIDADO**: Delete `.env.production` depois! Não commite no Git!

---

## 🔐 Segurança: Secrets Diferentes?

### Opção A: Mesmos Secrets (Simples)

```bash
# Dev e Prod usam os mesmos
WEBHOOK_SECRET="mesmo_valor"
INTERNAL_API_SECRET="mesmo_valor"
```

**Vantagem**: Mais simples  
**Desvantagem**: Se vazar, afeta ambos

### Opção B: Secrets Diferentes (Recomendado)

```bash
# Dev
WEBHOOK_SECRET="dev_secret_123..."

# Prod (gere novos)
openssl rand -hex 32  # Para prod
WEBHOOK_SECRET="prod_secret_456..."
```

**Vantagem**: Mais seguro  
**Desvantagem**: Precisa gerenciar 2 sets

**Recomendação**: Use secrets **diferentes** para produção! 🔒

---

## 📋 Checklist de Deploy

Antes de fazer deploy:

- [ ] Todas as variáveis configuradas na Vercel
- [ ] `DATABASE_URL` usa pooled connection (sem channel_binding)
- [ ] Secrets gerados (diferentes de dev, se possível)
- [ ] Wallet USDT configurada
- [ ] Provedor API configurado
- [ ] Testado localmente primeiro (`pnpm dev`)

---

## 🚀 Deploy

```bash
# 1. Deploy
vercel --prod

# 2. Verificar logs
vercel logs --follow

# 3. Testar endpoint
curl https://seu-app.vercel.app/api/donations \
  -H "Authorization: Bearer SEU_INTERNAL_API_SECRET"
```

---

## 🔍 Verificar Configuração

### Ver todas as env vars:

```bash
vercel env ls
```

### Ver valor específico:

```bash
vercel env pull .env.vercel
cat .env.vercel | grep DATABASE_URL
```

**⚠️ CUIDADO**: `.env.vercel` contém secrets! Delete depois.

---

## 🐛 Troubleshooting

### Variável não está sendo lida?

```bash
# 1. Verifique se está configurada
vercel env ls

# 2. Verifique se está no ambiente correto
# Dashboard → Settings → Environment Variables
# Confirme que está marcado "Production"

# 3. Redeploy após adicionar
vercel --prod
```

### Erro de conexão com banco?

```bash
# Verifique se DATABASE_URL está correta
# Deve ter: ?sslmode=require (sem channel_binding)
# Deve ter: -pooler no hostname
```

### Webhook não funciona?

```bash
# 1. Verifique WEBHOOK_SECRET na Vercel
# 2. Configure o mesmo no provedor
# 3. Teste manualmente:
curl -X POST https://seu-app.vercel.app/api/pix/webhook \
  -H "X-Webhook-Signature: test" \
  -d '{"test": true}'
```

---

## 📝 Resumo

**Para Produção**:

1. ✅ Configure env vars na **Vercel Dashboard**
2. ✅ Use secrets **diferentes** de dev (recomendado)
3. ✅ Mesma `DATABASE_URL` do Neon
4. ✅ Deploy: `vercel --prod`
5. ✅ Configure webhook no provedor com URL da Vercel

**Diferenças principais**:

- Dev: `.env.local` → Local
- Prod: Vercel Dashboard → Cloud
- Secrets: Diferentes (mais seguro)
- URL: `localhost:3000` vs `seu-app.vercel.app`

---

**Pronto para fazer deploy?** Configure as env vars na Vercel e vamos! 🚀

