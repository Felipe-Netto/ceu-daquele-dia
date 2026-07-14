import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// iTunes Search API — gratuita, sem chave, retorna preview_url MP3 de 30s reais.
// Substitui o Spotify que deprecou os preview_url em 2023.

interface ItunesTrack {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100: string
  previewUrl?: string
  trackViewUrl: string
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return Response.json({ tracks: [] })

  const url = new URL('https://itunes.apple.com/search')
  url.searchParams.set('term', q)
  url.searchParams.set('media', 'music')
  url.searchParams.set('entity', 'song')
  url.searchParams.set('limit', '5')
  url.searchParams.set('country', 'BR')
  url.searchParams.set('lang', 'pt_BR')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'CeuDaqueleDia/1.0' },
    next: { revalidate: 0 },
  })

  if (!res.ok) return Response.json({ tracks: [] })

  const data = await res.json()
  const items: ItunesTrack[] = data.results ?? []

  const tracks = items.map(item => ({
    id: String(item.trackId),
    nome: item.trackName,
    artista: item.artistName,
    // Troca 100x100 por 64x64 para thumbnail compacta
    capaUrl: item.artworkUrl100?.replace('100x100bb', '64x64bb') ?? '',
    trackUrl: item.trackViewUrl ?? '',
    previewUrl: item.previewUrl ?? null,
  }))

  return Response.json({ tracks })
}
