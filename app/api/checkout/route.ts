import type { NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { enviarEmailConfirmacao } from '@/app/lib/email'
import { getPreco } from '@/app/lib/preco'

export const dynamic = 'force-dynamic'

const MP_PAYMENTS_URL = 'https://api.mercadopago.com/v1/payments'
const DESCRICAO = 'Céu Daquele Dia — Assinatura Anual'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PixPayload {
  payment_method: 'pix'
}

interface CartaoPayload {
  payment_method: 'credit_card'
  token: string
  payment_method_id: string
  installments?: number
  issuer_id?: number
}

type CheckoutBody = {
  nome_parceiro_1: string
  nome_parceiro_2: string
  data_especial: string
  local: string
  latitude: number
  longitude: number
  email: string
  mensagem_personalizada?: string
  musica_url?: string
  musica_preview_url?: string
  musica_nome?: string
  musica_artista?: string
  musica_capa?: string
  url_foto_casal?: string
  url_imagem_ceu?: string
} & (PixPayload | CartaoPayload)

interface MpResponse {
  id?: number
  status?: string
  status_detail?: string
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string
      qr_code_base64?: string
    }
  }
  message?: string
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return normalized || 'parceiro'
}

function generateSlug(nome1: string, nome2: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${toSlug(nome1)}-e-${toSlug(nome2)}-${suffix}`
}

async function criarCasal(dados: {
  nome_parceiro_1: string
  nome_parceiro_2: string
  data_especial: string
  local: string
  latitude: number
  longitude: number
  email: string
  mensagem_personalizada: string | null
  musica_url: string | null
  musica_preview_url: string | null
  musica_nome: string | null
  musica_artista: string | null
  musica_capa: string | null
  url_foto_casal: string | null
  url_imagem_ceu: string | null
}): Promise<{ id: string; slug_pagina_exclusiva: string } | null> {
  // Tenta até 3 vezes caso o slug colida no banco (constraint unique)
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const slug = generateSlug(dados.nome_parceiro_1, dados.nome_parceiro_2)
    const { data, error } = await supabase
      .from('casais')
      .insert({ ...dados, slug_pagina_exclusiva: slug, status_pagamento: 'pending' })
      .select('id, slug_pagina_exclusiva')
      .single()

    if (!error && data) return data

    // Código 23505 = unique_violation no Postgres — tenta novo slug
    if ((error as { code?: string }).code !== '23505') return null
  }
  return null
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    return Response.json(
      { error: 'MERCADO_PAGO_ACCESS_TOKEN não configurado.' },
      { status: 500 }
    )
  }

  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  // Validação dos campos do casal
  const {
    nome_parceiro_1,
    nome_parceiro_2,
    data_especial,
    local,
    latitude,
    longitude,
    email,
    mensagem_personalizada,
    musica_url,
    musica_preview_url,
    musica_nome,
    musica_artista,
    musica_capa,
    url_foto_casal,
    url_imagem_ceu,
    payment_method,
  } = body

  if (
    !nome_parceiro_1 ||
    !nome_parceiro_2 ||
    !data_especial ||
    !local ||
    latitude == null ||
    longitude == null ||
    !email ||
    !payment_method
  ) {
    return Response.json({ error: 'Campos obrigatórios do casal ausentes.' }, { status: 400 })
  }

  // Validação dos campos de cartão
  if (payment_method === 'credit_card') {
    const { token, payment_method_id } = body as CartaoPayload
    if (!token || !payment_method_id) {
      return Response.json(
        { error: 'token e payment_method_id são obrigatórios para cartão de crédito.' },
        { status: 400 }
      )
    }
  }

  // 1. Buscar preço autoritativo no banco — nunca confiamos no front-end ──────
  const preco = await getPreco()

  // 2. Inserir casal com status pending ──────────────────────────────────────
  const casal = await criarCasal({
    nome_parceiro_1,
    nome_parceiro_2,
    data_especial,
    local,
    latitude,
    longitude,
    email,
    mensagem_personalizada: mensagem_personalizada ?? null,
    musica_url: musica_url ?? null,
    musica_preview_url: musica_preview_url ?? null,
    musica_nome: musica_nome ?? null,
    musica_artista: musica_artista ?? null,
    musica_capa: musica_capa ?? null,
    url_foto_casal: url_foto_casal ?? null,
    url_imagem_ceu: url_imagem_ceu ?? null,
  })

  if (!casal) {
    return Response.json(
      { error: 'Erro ao criar registro no banco de dados.' },
      { status: 500 }
    )
  }

  // 3. Montar payload para o Mercado Pago ────────────────────────────────────
  const mpPayload: Record<string, unknown> = {
    transaction_amount: preco,
    description: DESCRICAO,
    payer: { email },
  }

  if (payment_method === 'pix') {
    mpPayload.payment_method_id = 'pix'
  } else {
    const { token, payment_method_id, installments = 1, issuer_id } = body as CartaoPayload
    mpPayload.payment_method_id = payment_method_id
    mpPayload.token = token
    mpPayload.installments = installments
    if (issuer_id != null) mpPayload.issuer_id = issuer_id
  }

  // 4. Chamar a API do Mercado Pago ──────────────────────────────────────────
  const mpRes = await fetch(MP_PAYMENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify(mpPayload),
  })

  const mpData: MpResponse = await mpRes.json()

  if (!mpRes.ok) {
    // Erro na API do MP — remove o registro órfão para não poluir o banco
    await supabase.from('casais').delete().eq('id', casal.id)
    return Response.json(
      { error: 'Erro ao processar pagamento no Mercado Pago.', detail: mpData },
      { status: mpRes.status }
    )
  }

  // 4. Salvar o ID da transação e, para cartão, atualizar status imediatamente
  // (PIX é assíncrono — o webhook atualiza depois; cartão tem resultado na hora)
  const updateFields: Record<string, string> = { id_pagamento_mp: String(mpData.id) }
  if (payment_method === 'credit_card' && mpData.status) {
    updateFields.status_pagamento = mpData.status
  }
  await supabase
    .from('casais')
    .update(updateFields)
    .eq('id', casal.id)

  // 5. Cartão aprovado na hora → enviar e-mail imediatamente (webhook pode demorar ou não chegar)
  if (payment_method === 'credit_card' && mpData.status === 'approved') {
    const { data: casalCompleto } = await supabase
      .from('casais')
      .select('email, nome_parceiro_1, nome_parceiro_2, data_especial, local, slug_pagina_exclusiva, token_edicao')
      .eq('id', casal.id)
      .single()

    if (casalCompleto) {
      try {
        await enviarEmailConfirmacao(casalCompleto)
      } catch (err) {
        console.error('[checkout] Erro ao enviar e-mail de confirmação:', err)
      }
    } else {
      console.error('[checkout] casalCompleto não encontrado para id:', casal.id)
    }
  }

  // 6. Montar resposta para o frontend ───────────────────────────────────────
  const resposta: Record<string, unknown> = {
    status: mpData.status,
    status_detail: mpData.status_detail,
    id_pagamento_mp: String(mpData.id),
    casal_id: casal.id,
    slug: casal.slug_pagina_exclusiva,
  }

  if (payment_method === 'pix') {
    const txData = mpData.point_of_interaction?.transaction_data
    resposta.pix = {
      qr_code: txData?.qr_code ?? null,
      qr_code_base64: txData?.qr_code_base64 ?? null,
    }
  }

  return Response.json(resposta)
}
