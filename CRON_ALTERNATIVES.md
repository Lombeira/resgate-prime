# 🕐 Alternativas de Cron para Plano Hobby

O plano **Hobby da Vercel** só permite **1 cron job por dia**. Aqui estão alternativas **gratuitas** para ter crons mais frequentes:

---

## ✅ Opção 1: GitHub Actions (Recomendado)

**Gratuito** para repos públicos e 2000 minutos/mês em privados.

### Setup (2 minutos)

Crie `.github/workflows/reconcile.yml`:

```yaml
name: Reconcile Cron

on:
  schedule:
    # Roda a cada 30 minutos
    - cron: '*/30 * * * *'
  workflow_dispatch: # Permite executar manualmente

jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reconcile
        run: |
          curl -X GET "${{ secrets.VERCEL_APP_URL }}/api/cron/reconcile" \
            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_SECRET }}" \
            -H "User-Agent: GitHub-Actions-Cron"
```

### Configurar Secrets no GitHub:

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Adicione:
   - `VERCEL_APP_URL`: `https://seu-app.vercel.app`
   - `INTERNAL_API_SECRET`: seu secret do `.env`

### Vantagens:
- ✅ **Gratuito** ilimitado para repos públicos
- ✅ Roda até **a cada minuto** se quiser
- ✅ Logs completos das execuções
- ✅ Pode executar manualmente quando precisar

---

## ✅ Opção 2: Cron-job.org

**Gratuito** até 60 crons/dia, sem cadastro de cartão.

### Setup (1 minuto)

1. Acesse [cron-job.org](https://cron-job.org/en/)
2. Crie conta gratuita
3. Adicione novo cron:
   - **URL**: `https://seu-app.vercel.app/api/cron/reconcile`
   - **Interval**: A cada 30 minutos
   - **Headers**:
     ```
     Authorization: Bearer SEU_INTERNAL_API_SECRET
     ```

### Vantagens:
- ✅ Interface gráfica simples
- ✅ Notificações por email se falhar
- ✅ Histórico de execuções

---

## ✅ Opção 3: EasyCron

**Gratuito** até 12 crons/dia (a cada 2 horas).

### Setup (1 minuto)

1. Acesse [easycron.com](https://www.easycron.com/user/register)
2. Crie conta gratuita
3. Adicione cron job:
   - **URL**: `https://seu-app.vercel.app/api/cron/reconcile`
   - **Interval**: A cada 2 horas
   - **HTTP Header**: `Authorization: Bearer SEU_SECRET`

### Vantagens:
- ✅ Simples e direto
- ✅ Email de notificação
- ✅ Logs de execução

---

## ✅ Opção 4: Cloudflare Workers (Avançado)

**Gratuito** até 100,000 requisições/dia.

### Setup

Crie um Cloudflare Worker:

```javascript
export default {
  async scheduled(event, env, ctx) {
    await fetch('https://seu-app.vercel.app/api/cron/reconcile', {
      headers: {
        'Authorization': `Bearer ${env.INTERNAL_API_SECRET}`
      }
    });
  }
}
```

Configure trigger para a cada 30 minutos.

### Vantagens:
- ✅ Infinitamente escalável
- ✅ Baixa latência global
- ✅ Integração com Cloudflare

---

## 📊 Comparação

| Solução | Custo | Frequência | Setup | Confiabilidade |
|---------|-------|------------|-------|----------------|
| **GitHub Actions** | Grátis | Até 1 min | Fácil | ⭐⭐⭐⭐⭐ |
| **Cron-job.org** | Grátis | Até 1 min | Muito fácil | ⭐⭐⭐⭐ |
| **EasyCron** | Grátis | A cada 2h | Muito fácil | ⭐⭐⭐⭐ |
| **Cloudflare** | Grátis | Qualquer | Médio | ⭐⭐⭐⭐⭐ |
| **Vercel Hobby** | Grátis | 1x/dia | Já configurado | ⭐⭐⭐⭐⭐ |

---

## 💡 Recomendação

Para o **Resgate Prime**:

### Produção:
- **Vercel Hobby** (1x/dia às 3 AM) + **GitHub Actions** (a cada 30 min)
- Custo: **R$ 0/mês**
- Confiabilidade: Alta

### Se crescer muito:
- Upgrade para **Vercel Pro** ($20/mês)
- Cron nativo a cada minuto
- SLA garantido

---

## 🚀 Como Escolher?

**Baixo volume** (< 100 doações/dia):
→ Use apenas **Vercel Hobby** (1x/dia)
→ Sistema processa tudo imediatamente mesmo!

**Médio volume** (100-1000 doações/dia):
→ **Vercel Hobby** + **GitHub Actions** (30 min)
→ Confiabilidade máxima, custo zero

**Alto volume** (> 1000 doações/dia):
→ **Vercel Pro** ($20/mês)
→ Suporte profissional, SLA, cron por minuto

---

## 🔐 Segurança

**IMPORTANTE**: Proteja seu endpoint de cron!

1. ✅ Sempre use `Authorization: Bearer SECRET`
2. ✅ Valide o header no código (já implementado)
3. ✅ Não exponha secrets nos logs
4. ✅ Use HTTPS (sempre)

---

## 📝 Exemplo Completo: GitHub Actions

### `.github/workflows/reconcile.yml`

```yaml
name: Reconcile Cron

on:
  schedule:
    # A cada 30 minutos
    - cron: '*/30 * * * *'
  
  # Permite executar manualmente
  workflow_dispatch:

jobs:
  reconcile:
    runs-on: ubuntu-latest
    
    steps:
      - name: Trigger Reconciliation
        run: |
          response=$(curl -s -w "\n%{http_code}" \
            -X GET "${{ secrets.VERCEL_APP_URL }}/api/cron/reconcile" \
            -H "Authorization: Bearer ${{ secrets.INTERNAL_API_SECRET }}" \
            -H "User-Agent: GitHub-Actions-Reconcile")
          
          http_code=$(echo "$response" | tail -n1)
          body=$(echo "$response" | head -n-1)
          
          echo "HTTP Status: $http_code"
          echo "Response: $body"
          
          if [ "$http_code" -ne 200 ]; then
            echo "❌ Reconciliation failed!"
            exit 1
          fi
          
          echo "✅ Reconciliation successful!"
      
      - name: Notify on Failure
        if: failure()
        run: |
          echo "🚨 Reconciliation job failed!"
          # Adicione notificação Slack/Discord aqui se quiser
```

### Testar Manualmente

1. Vá em **Actions** no GitHub
2. Selecione "Reconcile Cron"
3. Clique em **Run workflow**
4. Veja os logs em tempo real

---

## 🎉 Conclusão

Você **não precisa** do plano Pro da Vercel!

Com GitHub Actions gratuito, você tem:
- ✅ Cron a cada 30 minutos
- ✅ Logs completos
- ✅ Custo: **R$ 0**
- ✅ Confiabilidade alta

**Configure em 2 minutos e nunca mais se preocupe!** 🚀

