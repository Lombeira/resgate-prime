# 💰 Wallet Dev vs Prod: Guia Completo

## 🤔 Você Precisa de Duas Wallets?

### Resposta Curta: **Não é obrigatório, mas é recomendado!**

---

## ✅ Vantagens de Ter Duas Wallets

### 1. **Organização e Controle**
```
Dev Wallet:
- Recebe USDT de testes
- Você pode resetar/limpar quando quiser
- Não mistura com dinheiro real

Prod Wallet:
- Recebe USDT de doações reais
- Mais seguro e isolado
- Fácil de auditar
```

### 2. **Segurança**
- Se dev wallet for comprometida, prod não é afetada
- Testes não afetam produção
- Isolamento de ambientes

### 3. **Auditoria**
- Fácil separar: "Este USDT é de teste" vs "Este é real"
- Melhor para compliance/contabilidade
- Logs mais limpos

---

## ❌ Desvantagens

### 1. **Mais Complexo**
- Precisa gerenciar 2 endereços
- Configurar em 2 lugares (.env.local e Vercel)

### 2. **Custo Extra**
- Taxa de rede ao transferir entre wallets (se precisar)
- Mas é mínimo (TRC20 ~$1)

---

## 🎯 Recomendação

### Para Começar: **Use apenas 1 wallet**

**Por quê?**
- Mais simples
- Funciona perfeitamente
- Você pode separar depois se quiser

### Quando Separar: **Quando tiver volume real**

**Separe quando**:
- Estiver recebendo doações reais
- Quiser isolar testes
- Precisa de auditoria separada

---

## 🔧 Como Configurar (Se Quiser Usar Ambas)

### Opção 1: Usar Apenas Dev (Recomendado para Começar)

**`.env.local`**:
```bash
USDT_WALLET_ADDRESS="TSeuEnderecoDev..."
USDT_NETWORK="TRC20"
```

**Vercel (produção)**:
- Use a **mesma** wallet dev por enquanto
- Ou configure wallet prod quando fizer deploy

### Opção 2: Usar Dev Local + Prod na Vercel

**`.env.local`** (desenvolvimento):
```bash
USDT_WALLET_ADDRESS="TEnderecoDev..."
USDT_NETWORK="TRC20"
```

**Vercel Dashboard** (produção):
```
USDT_WALLET_ADDRESS="TEnderecoProd..."
USDT_NETWORK="TRC20"
```

Assim:
- Testes locais → vão para wallet dev
- Produção → vai para wallet prod

---

## 📋 Configuração Prática

### Para Testes Locais:

```bash
# .env.local
USDT_WALLET_ADDRESS="TEnderecoDev..."
USDT_NETWORK="TRC20"
```

### Para Produção (Vercel):

1. Vercel Dashboard → Settings → Environment Variables
2. Adicione:
   ```
   USDT_WALLET_ADDRESS="TEnderecoProd..."
   USDT_NETWORK="TRC20"
   ```
3. Marque apenas **Production** (não Preview/Development)

**Resultado**:
- `pnpm dev` → usa wallet dev
- `vercel --prod` → usa wallet prod

---

## 🎯 Minha Recomendação para Você

### Agora (Desenvolvimento):

**Use apenas a wallet DEV**:

```bash
# .env.local
USDT_WALLET_ADDRESS="TEnderecoDev..."
USDT_NETWORK="TRC20"
```

**Por quê?**
- Mais simples para começar
- Testes vão para dev wallet
- Fácil de verificar se funcionou

### Depois (Quando Fizer Deploy):

**Configure wallet PROD na Vercel**:

1. Deploy: `vercel --prod`
2. Configure env vars na Vercel
3. Use wallet prod para produção

**Resultado**:
- Testes locais → Dev wallet
- Produção → Prod wallet
- Tudo organizado! ✅

---

## 💡 Dica: Nomenclatura

Para não confundir, nomeie assim:

```
Dev Wallet:
- Nome: "Resgate Prime - Dev"
- Endereço: TDev...

Prod Wallet:
- Nome: "Resgate Prime - Prod"
- Endereço: TProd...
```

Assim fica claro qual é qual! 🎯

---

## 🔄 Migrar Depois (Se Quiser)

Se começar com 1 wallet e quiser separar depois:

1. Crie nova wallet prod
2. Configure na Vercel
3. Pronto! Testes continuam na dev, prod usa nova

**Não precisa** transferir USDT antigo - pode deixar na dev wallet.

---

## 📊 Resumo

| Cenário | Wallet Dev | Wallet Prod | Recomendação |
|---------|------------|-------------|--------------|
| **Começando** | ✅ Usar | ❌ Não precisa | Simples |
| **Testando** | ✅ Usar | ❌ Não precisa | Isolado |
| **Produção** | ✅ Usar | ✅ Usar | Organizado |
| **Volume Alto** | ✅ Usar | ✅ Usar | Necessário |

---

## ✅ Conclusão

**Você fez certo** criando duas! 🎉

**Mas pode começar usando apenas a DEV**:
- Configure no `.env.local`
- Teste tudo funcionando
- Quando fizer deploy, configure PROD na Vercel

**Vantagem**: Você já tem as duas prontas para quando precisar! 🚀

---

**TL;DR**: Não precisa de duas agora, mas é bom ter. Use DEV para começar, PROD quando fizer deploy! 💰

