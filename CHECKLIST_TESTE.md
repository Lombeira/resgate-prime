# ✅ Checklist: Configuração para Teste

## 🎯 Status Atual

- ✅ **Neon Database** - Configurado e funcionando
- ✅ **Prisma Schema** - Aplicado no banco
- ✅ **Secrets (WEBHOOK_SECRET, INTERNAL_API_SECRET)** - Configurados
- ✅ **Wallet USDT** - Criada (dev e prod)
- ✅ **Variáveis na Vercel** - Configuradas
- ⏳ **Provedor (Mercado Bitcoin)** - Precisa configurar (ou testar sem)

---

## 📋 O que você precisa fazer AGORA:

### ✅ 1️⃣ Secrets de Segurança - **JÁ CONFIGURADO!**

Você já tem `WEBHOOK_SECRET` e `INTERNAL_API_SECRET` configurados! 🎉

**Próximo passo**: Criar wallet USDT

```bash
# Abra o terminal e execute:
openssl rand -hex 32  # Para WEBHOOK_SECRET
openssl rand -hex 32  # Para INTERNAL_API_SECRET
```

**Edite `.env.local`** e cole os valores:

```bash
WEBHOOK_SECRET="cole_aqui_o_primeiro_hex"
INTERNAL_API_SECRET="cole_aqui_o_segundo_hex"
```

---

### 2️⃣ Criar Wallet USDT (5 min) - **PRÓXIMO PASSO!**

#### Opção A: TronLink (Recomendado - TRC20)

1. Acesse: https://www.tronlink.org/
2. Instale extensão no navegador
3. Crie nova wallet
4. **COPIE** o endereço (começa com `T`)
5. **GUARDE** a seed phrase em lugar seguro!

**Edite `.env.local`**:

```bash
USDT_WALLET_ADDRESS="TSeuEnderecoAqui..."
USDT_NETWORK="TRC20"
```

#### Opção B: MetaMask (ERC20/Polygon)

1. Instale MetaMask
2. Crie wallet
3. Copie endereço (começa com `0x`)
4. Escolha rede: Ethereum ou Polygon

**Edite `.env.local`**:

```bash
USDT_WALLET_ADDRESS="0xSeuEnderecoAqui..."
USDT_NETWORK="ERC20"  # ou "POLYGON"
```

---

### 3️⃣ Configurar Provedor (15-30 min)

#### Opção A: Mercado Bitcoin (Recomendado)

**⚠️ IMPORTANTE**: Você precisa de conta **APROVADA** com KYC completo!

1. Acesse: https://www.mercadobitcoin.com.br
2. Faça login na sua conta
3. Vá em: **API** → **Credenciais**
4. Gere **API Key** e **Secret**
5. Copie ambos

**Edite `.env.local`**:

```bash
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
PROVIDER_API_KEY="sua_api_key_aqui"
PROVIDER_API_SECRET="seu_api_secret_aqui"
```

#### Opção B: Teste Local (Sem Provedor Real)

Se ainda não tem conta aprovada, pode testar localmente:

```bash
# Deixe vazio por enquanto
PROVIDER_API_KEY=""
PROVIDER_API_SECRET=""

# Teste apenas o webhook
pnpm test:webhook
```

Isso cria uma doação de **teste** no banco sem precisar do provedor real!

---

## 🧪 Testar Agora (Sem Provedor)

### Teste 1: Verificar Banco

```bash
# Abre Prisma Studio
pnpm db:studio
```

Deve abrir no navegador mostrando as tabelas vazias.

### Teste 2: Testar Webhook Simulado

```bash
# Inicie o servidor
pnpm dev

# Em outro terminal, execute:
pnpm test:webhook
```

Isso vai:
- ✅ Criar uma doação de teste no banco
- ✅ Verificar se o webhook funciona
- ✅ Testar o fluxo básico

**Verifique no Prisma Studio**: Deve aparecer uma `Donation` de R$ 50,00!

---

## 🚀 Teste Completo (Com Provedor Real)

### Passo 1: Configurar Webhook no Provedor

No painel do **Mercado Bitcoin**:

1. Vá em: **API** → **Webhooks**
2. Adicione:
   - **URL**: `https://seu-app.vercel.app/api/pix/webhook`
   - **Eventos**: Marque "PIX recebido"
   - **Secret**: Cole seu `WEBHOOK_SECRET`
3. Salvar

### Passo 2: Obter Chave PIX

1. Mercado Bitcoin → **Carteira** → **PIX**
2. Copie sua chave PIX (email/telefone/aleatória)

### Passo 3: Fazer PIX de Teste

1. Abra app do seu banco
2. **PIX** → **Pagar**
3. Cole a chave PIX do Mercado Bitcoin
4. Valor: **R$ 10,00** (mínimo)
5. Confirmar

**⏱️ Aguarde 2-5 minutos**

### Passo 4: Acompanhar

```bash
# Ver logs em tempo real
vercel logs --follow

# OU abra o dashboard
https://seu-app.vercel.app/dashboard
```

Você verá:
- 📥 PIX recebido
- 🔄 Ordem criada
- 💸 USDT sendo enviado
- ✅ Processado!

---

## 📊 Checklist Final

### ✅ Concluído:
- [x] `DATABASE_URL` configurado (Neon)
- [x] Prisma schema aplicado
- [x] `WEBHOOK_SECRET` configurado
- [x] `INTERNAL_API_SECRET` configurado

### ⏳ Pendente (para teste completo):
- [ ] `USDT_WALLET_ADDRESS` configurado
- [ ] `USDT_NETWORK` configurado (TRC20/ERC20)
- [ ] `PROVIDER_API_KEY` configurado (opcional para teste local)
- [ ] `PROVIDER_API_SECRET` configurado (opcional para teste local)

### 🧪 Testes:
- [ ] `pnpm db:studio` funciona
- [ ] `pnpm dev` roda sem erros
- [ ] `pnpm test:webhook` cria doação de teste

---

## 🎯 Próximos Passos (Ordem Recomendada)

### 🚀 AGORA (5 minutos):

1. **Criar Wallet USDT** → https://www.tronlink.org/
   - Instale extensão
   - Crie wallet
   - Copie endereço (começa com `T`)
   - Edite `.env.local`: `USDT_WALLET_ADDRESS="T..."`

2. **Testar Localmente** (sem provedor):
   ```bash
   pnpm dev              # Terminal 1
   pnpm test:webhook     # Terminal 2
   pnpm db:studio        # Ver resultado
   ```

### 📝 DEPOIS (quando tiver conta no provedor):

3. **Configurar Provedor**:
   - Mercado Bitcoin → API → Credenciais
   - Gere API Key e Secret
   - Edite `.env.local`

4. **Deploy Produção**:
   ```bash
   vercel --prod
   # Configure env vars na Vercel Dashboard
   ```

5. **Configurar Webhook**:
   - Mercado Bitcoin → API → Webhooks
   - URL: `https://seu-app.vercel.app/api/pix/webhook`
   - Secret: seu `WEBHOOK_SECRET`

6. **Fazer PIX Real**:
   - Envie R$ 10 para chave PIX do Mercado Bitcoin
   - Aguarde 2-5 minutos
   - Veja USDT chegar! 🎉

---

## 🆘 Precisa de Ajuda?

- **Erro no banco?** → `pnpm db:studio` para verificar
- **Erro no webhook?** → `pnpm test:webhook` para testar
- **Erro no provedor?** → Verifique API Key/Secret
- **Dúvidas?** → Veja `PRIMEIRO_PIX.md` para guia completo

---

---

## 🎯 Resumo: O que fazer AGORA

**Você já tem**:
- ✅ Database configurado
- ✅ Secrets configurados

**Falta apenas**:
1. ⏳ Criar wallet USDT (5 min) → https://www.tronlink.org/
2. ⏳ Testar localmente: `pnpm test:webhook`

**Depois** (quando tiver conta):
3. ⏳ Configurar provedor
4. ⏳ Deploy na Vercel
5. ⏳ Fazer PIX real

**Comece pela wallet - é rápido!** ⚡

