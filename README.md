# 🚀 Resgate Prime

Sistema completo de doações via PIX com conversão automática para USDT, desenvolvido com Next.js 14 e pronto para deploy na Vercel.

## 📋 Índice

- [Sobre](#sobre)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Deploy](#deploy)
- [Uso](#uso)
- [API](#api)
- [Segurança](#segurança)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

## 🎯 Sobre

O **Resgate Prime** é uma plataforma full-stack que:

1. ✅ Recebe doações via PIX através de provedor de custódia (Mercado Bitcoin / Parfin)
2. 🔄 Converte automaticamente BRL → USDT no melhor preço de mercado
3. 💸 Envia USDT para wallet própria (TRC20/ERC20/Polygon)
4. 📊 Oferece dashboard em tempo real para monitoramento
5. 🔐 Garante segurança, idempotência e auditoria completa

## 🏗️ Arquitetura

```
[Doador] --PIX--> [Provedor]
                      |
                  Webhook
                      |
         [Next.js API Routes (Vercel)]
                      |
        +-------------+-------------+
        |             |             |
    [Validate]   [Persist]     [Queue]
                      |             |
                   [DB]        [Workers]
                                    |
                         +----------+----------+
                         |          |          |
                     [Orders]  [Checks]  [Withdrawals]
                                    |
                              [Hot Wallet]
```

### Componentes

- **Frontend**: Next.js 14 App Router + Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (Supabase/PlanetScale/Neon) + Prisma ORM
- **Queue**: Upstash Redis (opcional, fallback síncrono)
- **Provedor**: Mercado Bitcoin / Parfin (adapter pattern)
- **Observability**: Logs estruturados + Sentry (opcional)

## 🛠️ Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache/Queue**: Redis (Upstash)
- **Styling**: Tailwind CSS
- **Validação**: Zod
- **HTTP Client**: Axios
- **Datas**: date-fns
- **Icons**: Lucide React

## ⚙️ Pré-requisitos

- Node.js 18+
- PostgreSQL database (ou use Supabase/PlanetScale)
- Conta em provedor de custódia (Mercado Bitcoin / Parfin)
- Upstash Redis (opcional)
- Wallet USDT (TRC20 recomendado)

## 📦 Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd resgate-prime

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Gere o Prisma Client
npm run db:generate

# Execute as migrations
npm run db:push

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## 🔧 Configuração

### 1. Variáveis de Ambiente

Edite `.env.local` com suas configurações:

```bash
# Database
DATABASE_URL="postgresql://..."

# Provider
PROVIDER_NAME="mercado_bitcoin"
PROVIDER_API_URL="https://api.mercadobitcoin.net"
PROVIDER_API_KEY="sua_api_key"
PROVIDER_API_SECRET="seu_api_secret"

# Webhook
WEBHOOK_SECRET="gere_com: openssl rand -hex 32"

# Wallet
USDT_WALLET_ADDRESS="seu_endereco_trc20"
USDT_NETWORK="TRC20"

# Security
INTERNAL_API_SECRET="gere_com: openssl rand -hex 32"

# Redis (opcional)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
```

### 2. Configurar Provedor

#### Mercado Bitcoin

1. Crie conta PJ no [Mercado Bitcoin](https://www.mercadobitcoin.com.br)
2. Solicite acesso à API e chave PIX
3. Configure webhook apontando para: `https://seu-dominio.vercel.app/api/pix/webhook`
4. Gere API Key e Secret na dashboard

#### Parfin

1. Entre em contato com [Parfin](https://parfin.io)
2. Complete o processo de KYC empresarial
3. Configure credenciais de API

### 3. Configurar Wallet

- **TRC20** (recomendado): Custos baixíssimos (~1 USDT)
- **ERC20**: Mais compatível, custos maiores (~$10-50)
- **Polygon**: Meio termo (~$0.01-1)

⚠️ **IMPORTANTE**: Use wallet multisig (Gnosis Safe) para valores altos!

## 🎯 Plano Vercel Hobby (Gratuito)

✅ **Este projeto funciona perfeitamente no plano gratuito da Vercel!**

O sistema foi otimizado para:
- Processamento imediato de doações (sem esperar cron)
- Reconciliação automática 1x por dia (03:00 UTC)
- Suporte a até **1000 doações/dia**
- **Custo: R$ 0/mês**

**Quer cron mais frequente?** Use GitHub Actions grátis! Veja `CRON_ALTERNATIVES.md`.

Veja `VERCEL_HOBBY_PLAN.md` para detalhes completos.

## 🚀 Deploy

### Deploy na Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configurações na Vercel

1. **Environment Variables**: Configure todas as variáveis do `.env.example`
2. **Cron Jobs**: Já configurado em `vercel.json` (worker a cada minuto)
3. **Domains**: Configure domínio personalizado
4. **Webhook URL**: Atualize no provedor para seu domínio Vercel

### Verificar Deploy

```bash
# Teste o webhook
curl -X POST https://seu-app.vercel.app/api/pix/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test" \
  -d '{"id":"test","type":"pix.received","timestamp":"2025-01-01T00:00:00Z","data":{}}'
```

## 🎯 Primeiro PIX de Teste

Quer testar o sistema? Veja o guia completo: **[PRIMEIRO_PIX.md](./PRIMEIRO_PIX.md)**

**Quick Start** (30 minutos):
1. Configure Neon PostgreSQL
2. Configure provedor (Mercado Bitcoin)
3. Crie wallet USDT
4. Preencha `.env.local`
5. Execute `pnpm db:push`
6. Faça PIX de R$ 10
7. Veja USDT chegar na sua wallet! 🎉

## 📚 Uso

### Dashboard

Acesse `/dashboard` para visualizar:
- Total de doações recebidas
- Status de conversões
- Transações on-chain
- Estatísticas em tempo real

### Fluxo Completo

1. **Doador** faz PIX para chave do provedor
2. **Provedor** envia webhook para `/api/pix/webhook`
3. **Sistema** valida, persiste e enfileira processamento
4. **Worker** cria ordem de compra USDT
5. **Provedor** executa ordem no mercado
6. **Worker** verifica fill e cria withdrawal
7. **Provedor** envia USDT para wallet
8. **Sistema** confirma e marca como processado

### API Endpoints

#### `POST /api/pix/webhook`
Recebe webhooks do provedor (protegido por assinatura HMAC).

#### `GET /api/donations`
Lista doações com filtros e paginação (requer autenticação).

```bash
curl https://seu-app.vercel.app/api/donations \
  -H "Authorization: Bearer SEU_INTERNAL_API_SECRET"
```

#### `GET /api/donations/:id`
Detalhes de doação específica.

#### `POST /api/admin/reconcile`
Força reconciliação de ordens/withdrawals pendentes (admin).

#### `GET /api/cron/worker`
Worker executado via Vercel Cron (protegido).

## 🔐 Segurança

### Implementado

✅ Validação de assinatura HMAC em webhooks  
✅ Verificação de timestamp (previne replay attacks)  
✅ Rate limiting por IP  
✅ Validação de esquema com Zod  
✅ Secrets em variáveis de ambiente  
✅ Idempotência em todas as operações  
✅ Audit log completo  
✅ Headers de segurança (X-Frame-Options, CSP, etc)

### Recomendações Adicionais

- Use **multisig wallet** (Gnosis Safe) para valores > R$10k
- Habilite **2FA** em todas as contas (provedor, Vercel, DB)
- Configure **IP allowlist** no provedor
- Rotacione **API keys** mensalmente
- Use **Cloudflare** na frente da Vercel para DDoS protection
- Implemente **alertas** via Slack/Email para eventos críticos

## 📊 Monitoramento

### Logs Estruturados

Todos os logs seguem formato JSON com contexto:

```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "info",
  "message": "Doação criada",
  "donationId": "abc123",
  "amountBrl": "100.00"
}
```

### Alertas Configurados

- ❌ Withdrawal falha após 3 tentativas → Slack/Email
- ⏰ Ordem pendente > 15 minutos → Warning
- 💰 Discrepância BRL/USDT > 2% → Critical
- 📉 Saldo baixo no provedor → Info

### Dashboards Recomendados

**Vercel Analytics**: Métricas de performance  
**Sentry**: Tracking de erros  
**Datadog/Logflare**: Logs agregados  
**Upstash Dashboard**: Métricas de fila

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. Verifique URL configurada no provedor
2. Teste com `curl` localmente
3. Verifique logs do Vercel
4. Confirme que WEBHOOK_SECRET está correto

### Ordem travada em PLACED

1. Execute `POST /api/admin/reconcile`
2. Verifique saldo BRL no provedor
3. Consulte logs do provedor
4. Ordem pode estar em fill parcial

### Withdrawal falha

1. Verifique endereço da wallet (formato correto?)
2. Confirme rede (TRC20/ERC20/Polygon)
3. Verifique saldo USDT no provedor
4. Consulte taxa de gas/network

### Erro de conexão com DB

1. Verifique `DATABASE_URL` em produção
2. Confirme que DB aceita conexões externas
3. Verifique SSL mode (`?sslmode=require`)

### Rate limit atingido

1. Reduza `RATE_LIMIT_MAX_REQUESTS` se falsos positivos
2. Configure Redis para rate limiting distribuído
3. Considere Cloudflare para proteção adicional

## 📖 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [API Mercado Bitcoin](https://www.mercadobitcoin.com.br/api-doc)
- [Vercel Deployment](https://vercel.com/docs)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🙋 Suporte

Para dúvidas ou problemas:

1. Verifique esta documentação
2. Consulte os logs
3. Abra uma issue no GitHub

---

Desenvolvido com ❤️ para facilitar doações transparentes com crypto
