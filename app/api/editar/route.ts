import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

// Allowlist: only these columns can be updated via this endpoint
const ALLOWED_FIELDS = [
  'nome_parceiro_1',
  'nome_parceiro_2',
  'data_especial',
  'local',
  'mensagem_personalizada',
  'musica_url',
  'musica_preview_url',
  'musica_nome',
  'musica_artista',
  'musica_capa',
  'slug_pagina_exclusiva',
  'url_foto_casal',
  'url_imagem_ceu',
] as const

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, ...fields } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })
    }

    // 1. Resolve casal by token
    const { data: casal, error: fetchErr } = await supabase
      .from('casais')
      .select('id, slug_pagina_exclusiva')
      .eq('token_edicao', token)
      .single()

    if (fetchErr || !casal) {
      return NextResponse.json({ error: 'Token inválido ou não encontrado' }, { status: 404 })
    }

    // 2. Validate slug if provided
    const slug: string | undefined = fields.slug_pagina_exclusiva
    if (slug !== undefined) {
      if (typeof slug !== 'string' || slug.length < 3) {
        return NextResponse.json(
          { error: 'O endereço deve ter pelo menos 3 caracteres', field: 'slug_pagina_exclusiva' },
          { status: 400 }
        )
      }
      if (!SLUG_RE.test(slug)) {
        return NextResponse.json(
          {
            error: 'Use apenas letras minúsculas, números e hifens (ex: ana-e-carlos)',
            field: 'slug_pagina_exclusiva',
          },
          { status: 400 }
        )
      }

      // Check uniqueness only if slug actually changed
      if (slug !== casal.slug_pagina_exclusiva) {
        const { data: existing } = await supabase
          .from('casais')
          .select('id')
          .eq('slug_pagina_exclusiva', slug)
          .neq('id', casal.id)
          .maybeSingle()

        if (existing) {
          return NextResponse.json(
            {
              error: 'Este endereço já está em uso. Escolha outro.',
              field: 'slug_pagina_exclusiva',
            },
            { status: 409 }
          )
        }
      }
    }

    // 3. Validate mensagem_personalizada length
    if (
      'mensagem_personalizada' in fields &&
      typeof fields.mensagem_personalizada === 'string' &&
      fields.mensagem_personalizada.length > 140
    ) {
      return NextResponse.json(
        { error: 'A mensagem personalizada não pode ter mais de 140 caracteres.', field: 'mensagem_personalizada' },
        { status: 400 }
      )
    }

    // 4. Build update payload — only allowlisted fields
    const payload: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in fields) payload[key] = fields[key]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // 5. Update
    const { error: updateErr } = await supabase
      .from('casais')
      .update(payload)
      .eq('token_edicao', token)

    if (updateErr) {
      console.error('[editar] supabase update error:', updateErr)
      return NextResponse.json({ error: 'Erro ao salvar. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      slug: slug ?? casal.slug_pagina_exclusiva,
    })
  } catch (err) {
    console.error('[editar] unexpected error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
