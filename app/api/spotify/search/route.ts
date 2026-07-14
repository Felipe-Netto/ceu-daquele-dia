import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ── Token cache ────────────────────────────────────────────────────────────────
// Module-level — persists within the same worker instance across requests.
let tokenCache: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value

  const id = process.env.SPOTIFY_CLIENT_ID
  const secret = process.env.SPOTIFY_CLIENT_SECRET
  if (!id || !secret) throw new Error('SPOTIFY_CLIENT_ID ou SPOTIFY_CLIENT_SECRET não configurados.')

  const creds = Buffer.from(`${id}:${secret}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Falha ao autenticar com Spotify: ${res.status}`)

  const data = await res.json()
  tokenCache = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // 60s de margem
  }
  return tokenCache.value
}

// ── Search handler ─────────────────────────────────────────────────────────────

interface SpotifyImage { url: string; width: number; height: number }

interface SpotifyTrack {
  id: string
  name: string
  preview_url: string | null
  artists: { name: string }[]
  album: { name: string; images: SpotifyImage[] }
  external_urls: { spotify: string }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return Response.json({ tracks: [] })

  let token: string
  try {
    token = await getAccessToken()
  } catch (err) {
    console.error('[spotify/search] auth error:', err)
    return Response.json({ error: 'Não foi possível conectar ao Spotify.' }, { status: 502 })
  }

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=5&market=BR`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    // Token might be stale — invalidate cache and return empty
    tokenCache = null
    return Response.json({ tracks: [] })
  }

  const data = await res.json()
  const items: SpotifyTrack[] = data.tracks?.items ?? []

  const tracks = items.map(track => ({
    id: track.id,
    nome: track.name,
    artista: track.artists.map(a => a.name).join(', '),
    albumNome: track.album.name,
    // Prefer smallest thumbnail (64px) for fast loading; fallback to largest
    capaUrl:
      track.album.images.findLast(img => img.width <= 100)?.url ??
      track.album.images.at(-1)?.url ??
      track.album.images[0]?.url ??
      '',
    spotifyUrl: track.external_urls.spotify,
    previewUrl: track.preview_url ?? null,
  }))

  return Response.json({ tracks })
}
