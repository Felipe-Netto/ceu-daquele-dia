import type { NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const foto = formData.get('foto') as File | null
  if (!foto || foto.size === 0) {
    return Response.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
  if (foto.size > MAX_SIZE) {
    return Response.json({ error: 'Arquivo muito grande. Máximo 10 MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await foto.arrayBuffer())
  const ext = foto.type === 'image/webp' ? 'webp' : foto.type.split('/')[1] || 'jpg'
  const filename = `fotos/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('fotos-casais')
    .upload(filename, buffer, { contentType: foto.type, upsert: false })

  if (error) {
    console.error('[upload-foto]', error)
    return Response.json({ error: 'Erro ao salvar a foto. Tente novamente.' }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('fotos-casais').getPublicUrl(filename)

  return Response.json({ url: publicUrl })
}
