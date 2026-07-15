import type { NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { getPreco } from '@/app/lib/preco'

export const dynamic = 'force-dynamic'

const MP_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'

type Body =
  | { slug: string; payment_method: 'pix' }
  | { slug: string; payment_method: 'credit_card'; token: string; payment_method_id: string; installments?: number }

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    return Response.json({ error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' }, { status: 500 })
  }

  let body: Body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { slug, payment_method } = body
  if (!slug || !payment_method) {
    return Response.json({ error: 'slug e payment_method são obrigatórios.' }, { status: 400 })
  }

  const [{ data: casal, error }, preco] = await Promise.all([
    supabase
      .from('casais')
      .select('id, email, status_pagamento')
      .eq('slug_pagina_exclusiva', slug)
      .single(),
    getPreco(),
  ])

  if (error || !casal) {
    return Response.json({ error: 'Casal não encontrado.' }, { status: 404 })
  }

  if (casal.status_pagamento !== 'approved') {
    return Response.json({ error: 'Apenas assinaturas aprovadas podem ser renovadas.' }, { status: 400 })
  }

  const mpPayload: Record<string, unknown> = {
    transaction_amount: preco,
    description: 'Céu Daquele Dia — Renovação Anual',
    payer: { email: casal.email },
    metadata: { tipo_transacao: 'renovacao', casal_id: casal.id },
  }

  if (payment_method === 'pix') {
    mpPayload.payment_method_id = 'pix'
  } else {
    const { token, payment_method_id, installments = 1 } = body as Extract<Body, { payment_method: 'credit_card' }>
    if (!token || !payment_method_id) {
      return Response.json({ error: 'token e payment_method_id são obrigatórios para cartão.' }, { status: 400 })
    }
    mpPayload.payment_method_id = payment_method_id
    mpPayload.token = token
    mpPayload.installments = installments
  }

  let mpRes: Response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mpData: any
  try {
    mpRes = await fetch(MP_PAYMENTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(mpPayload),
    })
    mpData = await mpRes.json()
  } catch (err) {
    console.error('[checkout/renovar] Falha ao chamar API do Mercado Pago:', err)
    return Response.json({ error: 'Falha ao conectar com o Mercado Pago. Tente novamente.' }, { status: 502 })
  }

  if (!mpRes.ok) {
    console.error('[checkout/renovar] Erro MP:', mpData)
    return Response.json(
      { error: 'Erro ao criar pagamento no Mercado Pago.', detail: mpData },
      { status: mpRes.status }
    )
  }

  if (payment_method === 'pix') {
    const txData = mpData.point_of_interaction?.transaction_data
    return Response.json({
      pix: {
        qr_code: txData?.qr_code ?? null,
        qr_code_base64: txData?.qr_code_base64 ?? null,
      },
    })
  }

  return Response.json({
    status: mpData.status,
    status_detail: mpData.status_detail,
  })
}
