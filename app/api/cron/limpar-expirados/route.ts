import { type NextRequest } from 'next/server'
import { supabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extrai o storage path de uma URL pública do Supabase Storage.
 *  Ex: ".../object/public/fotos-casais/fotos/uuid.jpg" → "fotos/uuid.jpg" */
function storagePathDaUrl(url: string | null): string | null {
  if (!url) return null
  const match = url.match(/fotos-casais\/(.+)$/)
  return match ? match[1] : null
}

async function deletarFotosStorage(urls: (string | null)[]): Promise<void> {
  const paths = urls.map(storagePathDaUrl).filter((p): p is string => p !== null)
  if (paths.length === 0) return
  const { error } = await supabase.storage.from('fotos-casais').remove(paths)
  if (error) console.error('[cron] Erro ao deletar fotos do Storage:', error.message)
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vercel injeta o header Authorization automaticamente usando CRON_SECRET.
  // Qualquer outra requisição (ex.: usuário batendo na URL) recebe 401.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agora = new Date()
  const log: Record<string, unknown> = { rodou_em: agora.toISOString() }

  // ── 1. Rascunhos não pagos com mais de 1 dia ────────────────────────────────
  // Inclui 'pending' e qualquer status que não seja 'approved' (ex.: falhas de cartão).
  const limite1dia = new Date(agora.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()

  const { data: rascunhos, error: errBuscaRascunhos } = await supabase
    .from('casais')
    .select('id, url_foto_casal')
    .neq('status_pagamento', 'approved')
    .lt('created_at', limite1dia)

  if (errBuscaRascunhos) {
    log.erro_rascunhos = errBuscaRascunhos.message
  } else if (rascunhos && rascunhos.length > 0) {
    await deletarFotosStorage(rascunhos.map(r => r.url_foto_casal))

    const { count, error: errDelete } = await supabase
      .from('casais')
      .delete({ count: 'exact' })
      .in('id', rascunhos.map(r => r.id))

    log.rascunhos_deletados = errDelete ? `erro: ${errDelete.message}` : (count ?? 0)
  } else {
    log.rascunhos_deletados = 0
  }

  // ── 2. Assinaturas pagas expiradas há mais de 10 dias ───────────────────────
  // Dá 10 dias de carência após a expiração antes de apagar definitivamente.
  const limite10dias = new Date(agora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expirados, error: errBuscaExpirados } = await supabase
    .from('casais')
    .select('id, url_foto_casal')
    .eq('status_pagamento', 'approved')
    .lt('data_expiracao', limite10dias)

  if (errBuscaExpirados) {
    log.erro_expirados = errBuscaExpirados.message
  } else if (expirados && expirados.length > 0) {
    await deletarFotosStorage(expirados.map(e => e.url_foto_casal))

    const { count, error: errDelete } = await supabase
      .from('casais')
      .delete({ count: 'exact' })
      .in('id', expirados.map(e => e.id))

    log.expirados_deletados = errDelete ? `erro: ${errDelete.message}` : (count ?? 0)
  } else {
    log.expirados_deletados = 0
  }

  console.log('[cron] limpar-expirados', log)
  return Response.json({ ok: true, ...log })
}
