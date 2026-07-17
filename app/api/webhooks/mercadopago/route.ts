import type { NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { enviarEmailConfirmacao, enviarEmailRenovacao } from '@/app/lib/email'

export const dynamic = 'force-dynamic'

// ─── Tipos da notificação do Mercado Pago ─────────────────────────────────────

interface MpNotificacao {
  action?: string
  type?: string
  data?: { id?: string | number }
}

interface MpPagamento {
  id: number
  status: string
  status_detail: string
  payer?: { email?: string }
  metadata?: {
    tipo_transacao?: string
    casal_id?: string
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    console.error('[webhook/mp] MERCADO_PAGO_ACCESS_TOKEN não configurado.')
    return new Response('Configuração inválida.', { status: 500 })
  }

  // 1. Parsear o corpo da notificação ────────────────────────────────────────
  let notificacao: MpNotificacao
  try {
    notificacao = await request.json()
  } catch {
    return new Response('Corpo inválido.', { status: 400 })
  }

  // Bypass exclusivo para validação no painel de desenvolvedor do Mercado Pago
  const paymentId = notificacao.data?.id
  if (String(paymentId) === '123456') {
    return Response.json({ message: 'Simulação de teste recebida com sucesso!' }, { status: 200 })
  }

  // O MP também envia notificações de outros tipos (subscription, chargebacks…)
  // Processamos apenas eventos de pagamento
  if (!paymentId || notificacao.type !== 'payment') {
    return new Response('OK', { status: 200 })
  }

  // 2. Verificar o pagamento diretamente na API do MP ────────────────────────
  // Nunca confiar apenas no payload — validar na fonte
  let pagamento: MpPagamento
  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!mpRes.ok) {
      console.error(`[webhook/mp] Erro ao buscar pagamento ${paymentId}:`, await mpRes.text())
      return new Response('Erro ao verificar pagamento.', { status: 502 })
    }
    pagamento = (await mpRes.json()) as MpPagamento
  } catch (err) {
    console.error('[webhook/mp] Falha na requisição à API do MP:', err)
    return new Response('Erro interno.', { status: 500 })
  }

  // Processar apenas pagamentos aprovados
  if (pagamento.status !== 'approved') {
    return new Response('OK', { status: 200 })
  }

  // 3a. Renovação — detectada via metadata ───────────────────────────────────
  const { tipo_transacao, casal_id } = pagamento.metadata ?? {}

  if (tipo_transacao === 'renovacao') {
    if (!casal_id) return new Response('OK', { status: 200 })

    const { data: casal } = await supabase
      .from('casais')
      .select('email, nome_parceiro_1, nome_parceiro_2, slug_pagina_exclusiva')
      .eq('id', casal_id)
      .eq('status_pagamento', 'approved')
      .single()

    if (!casal) {
      console.error('[webhook/mp] Casal não encontrado para renovação, id:', casal_id)
      return new Response('OK', { status: 200 })
    }

    const novaExpiracao = new Date()
    novaExpiracao.setFullYear(novaExpiracao.getFullYear() + 1)

    const { error: updateError } = await supabase
      .from('casais')
      .update({ data_expiracao: novaExpiracao.toISOString() })
      .eq('id', casal_id)

    if (updateError) {
      console.error('[webhook/mp] Erro ao renovar data_expiracao:', updateError)
      return new Response('Erro ao atualizar banco de dados.', { status: 500 })
    }

    try {
      await enviarEmailRenovacao({
        email: casal.email,
        nome_parceiro_1: casal.nome_parceiro_1,
        nome_parceiro_2: casal.nome_parceiro_2,
        slug_pagina_exclusiva: casal.slug_pagina_exclusiva,
        data_expiracao: novaExpiracao.toISOString(),
      })
    } catch (emailErr) {
      console.error('[webhook/mp] Erro ao enviar e-mail de renovação:', emailErr)
    }

    return new Response('OK', { status: 200 })
  }

  // 3b. Nova assinatura — busca pelo ID do pagamento ─────────────────────────
  const { data: casal, error: fetchError } = await supabase
    .from('casais')
    .select(
      'id, email, nome_parceiro_1, nome_parceiro_2, data_especial, local, slug_pagina_exclusiva, token_edicao, status_pagamento'
    )
    .eq('id_pagamento_mp', String(pagamento.id))
    .single()

  if (fetchError || !casal) {
    console.error('[webhook/mp] Casal não encontrado para id_pagamento_mp:', pagamento.id)
    // Retorna 200 para o MP não reenviar — o registro pode não existir por cancelamento
    return new Response('OK', { status: 200 })
  }

  // Idempotência: ignorar se já foi aprovado para não reenviar e-mail
  if (casal.status_pagamento === 'approved') {
    return new Response('OK', { status: 200 })
  }

  // 4. Atualizar status no banco (idempotente e à prova de corrida) ───────────
  // O update só afeta a linha se ela ainda NÃO estiver 'approved'. Cobre tanto
  // Pix ('pending') quanto cartão em análise ('in_process'). Se o polling
  // (/api/checkout/status) já tiver confirmado, nenhuma linha muda e evitamos
  // reenviar o e-mail de confirmação.
  const { data: confirmado, error: updateError } = await supabase
    .from('casais')
    .update({ status_pagamento: 'approved' })
    .eq('id', casal.id)
    .neq('status_pagamento', 'approved')
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('[webhook/mp] Erro ao atualizar status do casal:', updateError)
    // Retorna 500 para o MP retentar — o DB precisa ser atualizado
    return new Response('Erro ao atualizar banco de dados.', { status: 500 })
  }

  // Nenhuma linha mudou → o polling já confirmou e enviou o e-mail
  if (!confirmado) {
    return new Response('OK', { status: 200 })
  }

  // 5. Enviar e-mail de confirmação (não bloqueia a resposta se falhar) ───────
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
  } catch (emailErr) {
    // Log do erro mas não falha o webhook — o DB já foi atualizado com sucesso
    console.error('[webhook/mp] Erro ao enviar e-mail para', casal.email, ':', emailErr)
  }

  return new Response('OK', { status: 200 })
}
