@AGENTS.md


# CLAUDE.md - Diretrizes do Projeto "Céu Daquele Dia" 🌌

Este arquivo serve como guia de contexto, padrões e comandos para o desenvolvimento do micro-SaaS **Céu Daquele Dia**.

## 📌 Visão Geral do Projeto
Um serviço de página personalizada para casais contendo:
*   Um mapa estelar interativo simulado via `<canvas>` HTML5 (baseado em data/cidade).
*   Um carrossel de fotos (armazenadas no Supabase Storage).
*   Um contador de tempo de relacionamento (anos, meses, dias, horas, minutos, segundos).
*   Música de fundo integrada (Spotify/YouTube/Áudio).
*   **Fluxo Frictionless:** Sem cadastro ou login tradicional. Edição via Token dinâmico e visualização via UUID público.

---

## 🛠️ Stack Tecnológica
*   **Framework:** Next.js 14+ (App Router) com TypeScript
*   **Estilização:** Tailwind CSS (foco extremo em Mobile-First)
*   **Banco de Dados & Storage:** Supabase (Postgres + Storage Bucket público `fotos-casais`)
*   **E-mails Transacionais:** Resend (SDK oficial)
*   **Pagamentos:** API do Mercado Pago / Asaas (Integração Pix via Webhook)

---

## 💻 Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor local (http://localhost:3000)
npm run build        # Build de produção (verificar erros de tipagem/compilação)
npm run start        # Iniciar build localmente
npm run lint         # Executar linter

# Dependências Principais
# npm install @supabase/supabase-js resend lucide-react