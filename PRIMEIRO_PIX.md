# 🎯 Guia: Primeiro PIX de Teste

Checklist completo para fazer sua primeira doação PIX → USDT funcionando.

---

## ⚡ Quick Start (30 minutos)

### 1️⃣ Configurar Banco de Dados Neon (5 min)

```bash
# 1. Acesse https://console.neon.tech
# 2. Faça login (pode usar GitHub)
# 3. Clique "New Project"
#    - Name: resgate-prime
#    - Region: US East (Ohio)
#    - Postgres: 16
# 4. Copie a "Pooled connection string"
```

Exemplo:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```

---

### 2️⃣ Configurar Provedor (15 min)

Você precisa escolher um provedor de custódia com suporte a PIX:

#### Opção A: Mercado Bitcoin (Recomendado para testes)

```bash
# 1. Crie conta PJ: https://www.mercadobitcoin.com.br
# 2. Complete KYC empresarial (pode demorar 3-5 dias)
# 3. Ative API Pro na dashboard
# 4. Gere suas credenciais (API Key + Secret)
# 5. Configure chave PIX da sua conta
```

**⚠️ IMPORTANTE**: Para testes reais, você precisa de conta **APROVADA** com KYC completo.

#### Opção B: Parfin (Enterprise)

```bash
# 1. Entre em contato: https://parfin.io/contact
# 2. Complete onboarding empresarial
# 3. Receba credenciais de API
```

#### Opção C: Mock para Desenvolvimento Local

Se ainda não tem conta aprovada, pode simular localmente:

```bash
# Vamos criar um mock simples para testar a arquitetura
# Veja seção "Modo de Teste Local" abaixo
```

---

### 3️⃣ Criar Wallet USDT (2 min)

Você precisa de uma wallet para receber USDT.

#### Opção 1: TronLink (TRC20 - Recomendado)

```bash
# 1. Instale: https://www.tronlink.org/
# 2. Crie nova wallet
# 3. Copie seu endereço TRC20 (começa com "T")
# 4. GUARDE sua seed phrase em lugar SEGURO!
```

#### Opção 2: MetaMask (ERC20/Polygon)

```bash
# 1. Instale MetaMask
# 2. Copie endereço (começa com "0x")
# 3. Escolha rede: Ethereum ou Polygon
```

**💡 Dica**: TRC20 tem taxas **muito menores** (~$1 vs $10-50).

---

### 4️⃣ Configurar Variáveis de Ambiente (3 min)

Crie `.env.local`:

```bash
# Copie o template
cp .env.neon.example .env.local

# Edite com suas credenciais
nano .env.local
```

**Mínimo necessário para teste**:

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Provider (Mercado Bitcoin)
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
PROVIDER_API_KEY="sua_api_key_aqui"
PROVIDER_API_SECRET="seu_api_secret_aqui"

# Segurança (gere com: openssl rand -hex 32)
WEBHOOK_SECRET="seu_webhook_secret_32_chars"
INTERNAL_API_SECRET="seu_internal_secret_32_chars"

# Wallet
USDT_WALLET_ADDRESS="seu_endereco_trc20"
USDT_NETWORK="TRC20"

# Config
ENABLE_AUTO_WITHDRAW="true"
MIN_DONATION_BRL="10"
MAX_DONATION_BRL="50000"
NODE_ENV="development"
```

**Gerar secrets**:
```bash
openssl rand -hex 32  # Use para WEBHOOK_SECRET
openssl rand -hex 32  # Use para INTERNAL_API_SECRET
```

---

### 5️⃣ Configurar Database (2 min)

```bash
# Instalar dependências
pnpm install

# Gerar Prisma Client
pnpm db:generate

# Aplicar schema no Neon
pnpm db:push

# Verificar (abre navegador)
pnpm db:studio
```

✅ Se o Prisma Studio abrir, está tudo certo!

---

### 6️⃣ Testar Localmente (3 min)

```bash
# Iniciar servidor
pnpm dev

# Deve aparecer:
# ✓ Ready in Xms
# Local: http://localhost:3000
```

Abra http://localhost:3000 - deve ver a página inicial! 🎉

---

## 🧪 Modo de Teste Local (Sem Provedor Real)

Se ainda não tem conta aprovada no provedor, pode simular:

### Criar Mock do Webhook

```bash
# Criar script de teste
cat > test-webhook.sh << 'EOF'
#!/bin/bash

# Simula webhook do provedor
curl -X POST http://localhost:3000/api/pix/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature" \
  -H "X-Webhook-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -d '{
    "id": "test-'$(date +%s)'",
    "type": "pix.received",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "data": {
      "transactionId": "PIX-TEST-'$(date +%s)'",
      "amountBrl": "50.00",
      "payerName": "João Teste",
      "payerDocument": "12345678900",
      "pixKey": "test@example.com"
    }
  }'
EOF

chmod +x test-webhook.sh
```

**Executar teste**:
```bash
./test-webhook.sh
```

Isso vai criar uma doação de teste no banco! Verifique em `pnpm db:studio`.

---

## 🚀 Deploy na Vercel (5 min)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Configure no Vercel Dashboard**:
1. Settings → Environment Variables
2. Adicione **TODAS** as variáveis do `.env.local`
3. Save e redeploy

---

## 💳 Fazer Primeiro PIX Real

### Passo 1: Configurar Webhook no Provedor

No painel do **Mercado Bitcoin**:

```
1. Vá em: API → Webhooks
2. Adicione URL: https://seu-app.vercel.app/api/pix/webhook
3. Eventos: Marque "PIX recebido"
4. Secret: Cole seu WEBHOOK_SECRET
5. Salvar
```

### Passo 2: Obter Chave PIX

```
1. No Mercado Bitcoin: Carteira → PIX
2. Copie sua chave PIX (email/telefone/aleatória)
3. Esta é a chave para onde você vai enviar o PIX!
```

### Passo 3: Fazer PIX de Teste

```bash
# Use seu banco pessoal:
# 1. Abra app do banco
# 2. PIX → Pagar
# 3. Cole a chave PIX do Mercado Bitcoin
# 4. Valor: R$ 10,00 (mínimo)
# 5. Confirmar
```

**⏱️ Aguarde 2-5 minutos**

---

## 🔍 Acompanhar Processamento

### Opção 1: Logs da Vercel

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

### Opção 2: Dashboard

Abra: `https://seu-app.vercel.app/dashboard`

Verá sua doação com status:
- 🟡 PENDING → Processando
- 🔵 PROCESSING → Convertendo
- 🟢 PROCESSED → Concluído!

### Opção 3: Prisma Studio (local)

```bash
pnpm db:studio
```

Veja tabelas:
- **Donation** → Sua doação
- **Order** → Ordem BRL→USDT
- **Withdrawal** → USDT sendo enviado

### Opção 4: Verificar USDT na Wallet

**TRC20**: https://tronscan.org/#/address/SEU_ENDERECO

Você verá a transação USDT chegando! 🎉

---

## ✅ Checklist Final

Antes de fazer o PIX, confirme:

- [ ] Neon configurado e `pnpm db:studio` funciona
- [ ] `.env.local` preenchido com todas as credenciais
- [ ] `pnpm dev` roda sem erros
- [ ] Deploy na Vercel feito
- [ ] Environment variables configuradas na Vercel
- [ ] Webhook configurado no provedor
- [ ] Chave PIX obtida do provedor
- [ ] Wallet USDT criada e endereço copiado

**Tudo OK?** Faça o PIX! 💰

---

## 🐛 Troubleshooting

### Webhook não está chegando

```bash
# Teste manualmente
curl -X POST https://seu-app.vercel.app/api/pix/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test" \
  -d '{"test": true}'

# Deve retornar 401 (assinatura inválida) OU 200
```

**Soluções**:
- Confirme URL do webhook no provedor
- Verifique se WEBHOOK_SECRET está correto
- Veja logs: `vercel logs --follow`

### Ordem não está sendo criada

```bash
# Verifique saldo BRL no provedor
# API pode estar falhando por falta de saldo
```

**Soluções**:
- Deposite BRL na conta do provedor
- Verifique API Key e Secret
- Teste conexão com provedor

### Withdrawal não sai

**Soluções**:
- Verifique endereço da wallet (TRC20 começa com "T")
- Confirme rede correta (TRC20/ERC20)
- Verifique saldo USDT no provedor
- Veja se `ENABLE_AUTO_WITHDRAW="true"`

### Database não conecta

```bash
# Teste conexão direta
pnpm prisma db pull
```

**Soluções**:
- Confirme DATABASE_URL está correta
- Verifique se tem `?sslmode=require&pgbouncer=true`
- Teste no Neon dashboard se DB está ativo

---

## 💰 Custos do Teste

| Item | Custo |
|------|-------|
| Neon Database | R$ 0 (free tier) |
| Vercel Hosting | R$ 0 (hobby plan) |
| PIX de R$ 10 | R$ 10 |
| Taxa provedor (~0.5%) | R$ 0,05 |
| Taxa TRC20 | ~R$ 1 |
| **TOTAL** | **~R$ 11** |

**Você receberá**: ~9.90 USDT na sua wallet 🎉

---

## 🎊 Sucesso!

Se tudo funcionou:
1. ✅ PIX foi recebido
2. ✅ Ordem de BRL→USDT executada
3. ✅ USDT chegou na sua wallet
4. ✅ Dashboard mostra status PROCESSED

**Parabéns!** 🎉 Seu sistema está funcionando!

---

## 📝 Próximos Passos

Agora que testou:

1. **Aumente limites** em `.env`:
   ```bash
   MAX_DONATION_BRL="10000"  # ou quanto quiser
   ```

2. **Configure alertas**:
   ```bash
   SLACK_WEBHOOK_URL="..."
   ALERT_EMAIL="seu@email.com"
   ```

3. **Adicione autenticação** no dashboard

4. **Configure domínio customizado** na Vercel

5. **Implemente KYC/AML** se necessário (compliance)

6. **Configure GitHub Actions** para cron mais frequente

---

## 🆘 Precisa de Ajuda?

1. Consulte logs: `vercel logs --follow`
2. Verifique Prisma Studio: `pnpm db:studio`
3. Teste webhook manualmente (script acima)
4. Revise todas as env vars
5. Abra issue no GitHub

**Boa sorte com seu primeiro PIX!** 🚀💰

