# 🐘 Setup Neon PostgreSQL - Resgate Prime

Guia completo para configurar Neon como banco de dados.

## 🚀 Por que Neon?

- ✅ **Serverless** - Perfeito para Next.js na Vercel
- ✅ **Auto-scaling** - Escala automaticamente com a demanda
- ✅ **Branching** - Cria branches do DB para dev/staging
- ✅ **Cold start rápido** - Acorda em ~100ms
- ✅ **Generoso free tier** - 0.5 GB storage, 191 horas compute/mês

## 📝 Passo a Passo

### 1. Criar conta no Neon

1. Acesse [neon.tech](https://neon.tech)
2. Clique em "Sign Up" (pode usar GitHub)
3. Crie um novo projeto:
   - **Name**: `resgate-prime`
   - **Region**: `US East (Ohio)` ou mais próximo
   - **Postgres version**: 16 (recomendado)

### 2. Obter Connection Strings

No dashboard do Neon, você verá duas connection strings:

#### 🔗 **Connection String (Pooled)**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```
**Use esta para a aplicação Next.js** (melhor para serverless)

#### 🔗 **Direct Connection String**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```
**Use esta para migrations do Prisma**

### 3. Configurar Variáveis de Ambiente

Edite `.env.local`:

```bash
# Neon Database - Pooled (para aplicação)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10"

# Neon Database - Direct (para migrations)
DIRECT_DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**⚠️ IMPORTANTE**: Substitua pelos valores reais do seu projeto Neon!

### 4. Atualizar Prisma Schema

O schema já está configurado, mas vamos adicionar suporte específico para Neon:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

### 5. Executar Migrations

```bash
# Gerar Prisma Client
pnpm db:generate

# Push schema para Neon (primeira vez)
pnpm db:push

# OU criar migration (produção)
pnpm prisma migrate dev --name init
```

### 6. Verificar Conexão

```bash
# Abrir Prisma Studio
pnpm db:studio
```

Se abrir o navegador em `http://localhost:5555`, está tudo funcionando! ✅

## 🔧 Configurações Adicionais

### Connection Pooling (PgBouncer)

O Neon já inclui PgBouncer automático quando você usa `?pgbouncer=true`. Isso é **essencial** para serverless pois:

- ✅ Reutiliza conexões
- ✅ Reduz cold starts
- ✅ Evita limite de conexões
- ✅ Melhor performance

### Timeouts

Adicione timeouts para evitar hanging connections:

```bash
DATABASE_URL="...?connect_timeout=10&pool_timeout=10"
```

### SSL Mode

Sempre use `sslmode=require` com Neon (já vem configurado).

## 🌿 Branching (Opcional)

Neon permite criar **branches** do database:

```bash
# No dashboard Neon, crie um branch "development"
# Copie a connection string do branch

# Use em .env.local para desenvolvimento
DATABASE_URL="postgresql://...branch-name..."
```

**Benefícios**:
- Testa migrations sem afetar produção
- Cada feature pode ter seu próprio DB
- Reset fácil quando necessário

## 🚀 Deploy na Vercel

### 1. Configure Environment Variables

Na Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL = postgresql://user:password@ep-xxx...?sslmode=require&pgbouncer=true
DIRECT_DATABASE_URL = postgresql://user:password@ep-xxx...?sslmode=require
```

### 2. Execute Migrations

**Opção A**: Via Vercel (automático no build)

Adicione em `package.json`:
```json
"scripts": {
  "build": "prisma generate && prisma migrate deploy && next build"
}
```

**Opção B**: Manual (recomendado para controle)

```bash
# Local, antes do deploy
pnpm prisma migrate deploy
```

### 3. Monitoramento

No dashboard Neon:
- **Queries** - Veja queries lentas
- **Branches** - Gerencie ambientes
- **Usage** - Monitore consumo

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

✅ **Solução**: Verifique:
1. Connection string está correta
2. IP/region está acessível
3. SSL mode está configurado

### Erro: "Too many connections"

✅ **Solução**: Use pooled connection:
```
?pgbouncer=true&connection_limit=10
```

### Erro: "Prepared statement already exists"

✅ **Solução**: Adicione ao pooled connection:
```
?pgbouncer=true&pgbouncer_mode=transaction
```

### Migrations não aplicam

✅ **Solução**: Use `DIRECT_DATABASE_URL` para migrations:
```bash
DATABASE_URL=$DIRECT_DATABASE_URL pnpm prisma migrate dev
```

## 📊 Limites do Free Tier

- **Storage**: 0.5 GB
- **Compute**: 191 horas/mês (~7 dias)
- **Branches**: 10
- **Projects**: Ilimitados

**Dica**: Use "Scale to Zero" - o DB hiberna quando não usado e acorda em ~100ms.

## 🔐 Segurança

### ✅ Boas práticas:

1. **Nunca commite** `.env.local` com credenciais reais
2. **Rotacione passwords** mensalmente
3. **Use roles separados** para app vs migrations
4. **Ative IP Allowlist** no Neon (se precisar)
5. **Monitor query logs** regularmente

### Criar usuário read-only (opcional):

```sql
-- No SQL Editor do Neon
CREATE ROLE readonly;
GRANT CONNECT ON DATABASE neondb TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

CREATE USER dashboard_user WITH PASSWORD 'strong_password';
GRANT readonly TO dashboard_user;
```

## 🎯 Próximos Passos

Após configurar Neon:

1. ✅ Teste conexão com `pnpm db:studio`
2. ✅ Execute migrations com `pnpm db:push`
3. ✅ Popule dados de teste (opcional)
4. ✅ Configure Vercel environment variables
5. ✅ Deploy!

---

**Pronto!** 🎉 Seu banco Neon está configurado e otimizado para serverless.

## 📚 Links Úteis

- [Neon Dashboard](https://console.neon.tech)
- [Neon Docs](https://neon.tech/docs)
- [Prisma + Neon Guide](https://neon.tech/docs/guides/prisma)
- [Neon Discord](https://discord.gg/neon) - Suporte muito rápido!

