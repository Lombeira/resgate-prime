# ⚡ Quick Start com Neon - 5 minutos

Guia ultra-rápido para colocar o Resgate Prime rodando com Neon.

## 1️⃣ Criar Database Neon (2 min)

```bash
# 1. Acesse https://neon.tech e faça login
# 2. Clique em "New Project"
# 3. Configure:
#    - Name: resgate-prime
#    - Region: US East (Ohio) ou mais próximo
#    - Postgres: 16
# 4. Clique em "Create Project"
```

## 2️⃣ Copiar Connection Strings (1 min)

No dashboard do Neon, você verá:

```
📊 Connection Details
```

Copie AMBAS as strings:

1. **Pooled** (com `?pgbouncer=true`)
2. **Direct** (sem pgbouncer)

## 3️⃣ Configurar Ambiente (1 min)

```bash
# Copie o template
cp .env.neon.example .env.local

# Edite .env.local
# Cole as connection strings do Neon
nano .env.local  # ou use seu editor favorito
```

Substitua:
- `[user]` → seu usuário
- `[password]` → sua senha  
- `[endpoint]` → endpoint do Neon (ex: ep-xxx-123.us-east-2.aws.neon.tech)
- `[dbname]` → nome do DB (geralmente `neondb`)

## 4️⃣ Executar Migrations (1 min)

```bash
# Instalar dependências (se ainda não fez)
pnpm install

# Gerar Prisma Client
pnpm db:generate

# Aplicar schema no Neon
pnpm db:push

# ✅ Sucesso! Verifique no Prisma Studio
pnpm db:studio
```

## 5️⃣ Iniciar App

```bash
# Rodar em desenvolvimento
pnpm dev

# Abra http://localhost:3000
```

---

## ✅ Verificação Rápida

Se tudo funcionou:

1. ✅ Prisma Studio abre em `localhost:5555`
2. ✅ Você vê as tabelas: `Donation`, `Order`, `Withdrawal`, etc
3. ✅ App Next.js carrega sem erros

## 🐛 Problema?

### Erro de conexão?

```bash
# Teste a conexão
pnpm prisma db pull
```

Se falhar:
- ✅ Verifique se copiou as strings completas
- ✅ Confirme que `sslmode=require` está presente
- ✅ Tente usar a **Direct** connection para teste

### Migrations não aplicam?

```bash
# Use a direct connection explicitamente
DATABASE_URL=$DIRECT_DATABASE_URL pnpm db:push
```

---

## 🚀 Pronto!

Seu banco Neon está configurado e rodando! 

**Próximo passo**: Configure o provedor (Mercado Bitcoin/Parfin) em `.env.local`

Veja `SETUP.md` para guia completo.

