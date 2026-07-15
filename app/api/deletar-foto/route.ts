import { type NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''

export async function DELETE(req: NextRequest) {
  let url: string
  try {
    const body = await req.json()
    url = body.url
  } catch {
    return Response.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (!url || typeof url !== 'string') {
    return Response.json({ ok: true }) // nada a deletar
  }

  // Só deleta arquivos do nosso próprio Supabase Storage
  if (!SUPABASE_URL || !url.startsWith(SUPABASE_URL)) {
    return Response.json({ ok: true })
  }

  const match = url.match(/fotos-casais\/(.+)$/)
  if (!match) return Response.json({ ok: true })

  const { error } = await supabase.storage.from('fotos-casais').remove([match[1]])
  if (error) console.error('[deletar-foto]', error.message)

  return Response.json({ ok: true })
}
