import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') ?? ''
  const uf = request.nextUrl.searchParams.get('uf') ?? ''

  if (!city) return Response.json({ error: 'city é obrigatório' }, { status: 400 })

  const q = `${city}, ${uf}, Brasil`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&accept-language=pt`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'CeuDaqueleDia/1.0 (felipenetto00@gmail.com)' },
  })

  if (!res.ok) return Response.json({ error: 'Erro ao consultar geocodificação' }, { status: 502 })

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) {
    return Response.json({ error: 'Cidade não encontrada' }, { status: 404 })
  }

  return Response.json({
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  })
}
