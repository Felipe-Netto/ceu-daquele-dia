@AGENTS.md

# CLAUDE.md - Diretrizes do Projeto "Céu Daquele Dia" 🌌

Este arquivo serve como guia de contexto, padrões, regras de negócio e comandos para o desenvolvimento do micro-SaaS **Céu Daquele Dia**.

## 📌 Visão Geral do Projeto
Um serviço de páginas personalizadas e românticas para casais comercializado no modelo de **Assinatura Anual (R$ 29,90/ano)** contendo:
*   Um mapa estelar interativo real gerado via **AstronomyAPI** (baseado em data/cidade).
*   A fase da lua real daquela noite com porcentagem de brilho obtida via **AstronomyAPI**.
*   Um carrossel de fotos (armazenadas diretamente no Supabase Storage).
*   Um contador de tempo de relacionamento ativo em tempo real.
*   Música de fundo integrada (Spotify/YouTube/Áudio).
*   **Fluxo Frictionless:** Sem cadastro ou login tradicional. Edição via Token dinâmico e visualização via UUID público.

---

## 🛠️ Stack Tecnológica
*   **Framework:** Next.js 14+ (App Router) com TypeScript
*   **Estilização:** Tailwind CSS (foco extremo em Mobile-First, aplicando filtros e blend-modes para deixar os mapas estelares lindamente integrados ao background espacial)
*   **Banco de Dados & Storage:** Supabase (Postgres + Storage Bucket público `fotos-casais`)
*   **E-mails Transacionais:** Resend (SDK oficial) para entrega de token de edição e avisos de renovação/expiração.
*   **Pagamentos:** API do Mercado Pago / Asaas (Integração Pix via Webhook - R$ 29,90/ano)

---

## 📅 Regra de Negócio: Assinatura Anual & Expiração
1.  **Geração e Validade:** Ao confirmar o pagamento do Pix, a linha do casal é criada com `data_expiracao` definida para exatamente **1 ano** no futuro (`now() + interval '1 year'`).
2.  **Validação de Acesso (`/casal/[id]`):** Se a data atual for maior que `data_expiracao`, a página pública é bloqueada e redirecionada para uma tela elegante de expiração oferecendo a renovação por mais R$ 29,90.
3.  **Rotina de Limpeza (Cleanup API):** Um endpoint de cron job semanal `/api/cron/limpar-expirados` deve buscar casais expirados há mais de 30 dias, deletar suas fotos correspondentes no Supabase Storage para manter o espaço limpo e remover o registro do banco de dados.

---

## 💻 Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor local (http://localhost:3000)
npm run build        # Build de produção (verificar erros de tipagem/compilação)
npm run start        # Iniciar build localmente
npm run lint         # Executar linter

# Dependências Principais recomendadas para o Claude
# npm install @supabase/supabase-js resend lucide-react