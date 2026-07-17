import type { NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { enviarEmailConfirmacao } from '@/app/lib/email'

// Nunca cachear — precisamos do status ao vivo a cada chamada do polling
export const dynamic = 'force-dynamic'

/**
 * GET /api/checkout/status?slug=ana-e-carlos-1234
 *
 * Rota consultada pelo front (polling) enquanto o QR Code do Pix está na tela.
 * Responde um de três estados:
 *   { status: 'approved', slug }  → o front redireciona para /casal/[slug]
 *   { status: 'pending' }         → o front continua perguntando
 *   { status: 'not_found' }       → slug inexistente (404)
 *
 * Estratégia (Opção robusta): lê o banco primeiro; se ainda estiver pendente,
 * consulta o Mercado Pago diretamente. Assim o redirecionamento acontece mesmo
 * que o webhook esteja atrasado ou não chegue.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return Response.json({ error: 'Parâmetro "slug" é obrigatório.' }, { status: 400 })
  }

  // 1. Buscar o casal pelo slug ────────────────────────────────────────────────
  const { data: casal } = await supabase
    .from('casais')
    .select(
      'id, status_pagamento, id_pagamento_mp, slug_pagina_exclusiva, email, nome_parceiro_1, nome_parceiro_2, data_especial, local, token_edicao'
    )
    .eq('slug_pagina_exclusiva', slug)
    .maybeSingle()

  if (!casal) {
    return Response.json({ status: 'not_found' }, { status: 404 })
  }

  // 2. Caminho rápido: o webhook já confirmou → responde na hora ────────────────
  if (casal.status_pagamento === 'approved') {
    return Response.json({ status: 'approved', slug: casal.slug_pagina_exclusiva })
  }

  // 3. Ainda pendente: consultar a fonte da verdade (Mercado Pago) ──────────────
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (accessToken && casal.id_pagamento_mp) {
    try {
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${casal.id_pagamento_mp}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )

      if (mpRes.ok) {
        const pagamento = (await mpRes.json()) as { status?: string }

        if (pagamento.status === 'approved') {
          // Confirmação IDEMPOTENTE e à prova de corrida:
          // o update só afeta uma linha se ela ainda estiver 'pending'.
          // Quem "vencer" (polling OU webhook) é o único que envia o e-mail.
          const { data: confirmado } = await supabase
            .from('casais')
            .update({ status_pagamento: 'approved' })
            .eq('id', casal.id)
            .neq('status_pagamento', 'approved')
            .select('id')
            .maybeSingle()

          if (confirmado) {
            // Este request venceu a corrida → dispara o e-mail de confirmação
            try {
              await enviarEmailConfirmacao({
                email: casal.email,
                nome_parceiro_1: casal.nome_parceiro_1,
                nome_parceiro_2: casal.nome_parceiro_2,
                data_especial: casal.data_especial,
                local: casal.local,
                slug_pagina_exclusiva: casal.slug_pagina_exclusiva,
                token_edicao: casal.token_edicao,
              })
            } catch (err) {
              // Falha no e-mail não deve travar o redirecionamento
              console.error('[status] Erro ao enviar e-mail de confirmação:', err)
            }
          }

          return Response.json({ status: 'approved', slug: casal.slug_pagina_exclusiva })
        }
      }
    } catch (err) {
      // Rede instável ou MP fora do ar: apenas responde "pending" e o front tenta de novo
      console.error('[status] Erro ao consultar o Mercado Pago:', err)
    }
  }

  // 4. Segue pendente ───────────────────────────────────────────────────────────
  return Response.json({ status: 'pending' })
}
