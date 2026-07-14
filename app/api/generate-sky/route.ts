import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const appId = process.env.ASTRONOMY_API_APP_ID
  const appSecret = process.env.ASTRONOMY_API_APP_SECRET

  if (!appId || !appSecret) {
    return Response.json(
      { error: 'Credenciais da AstronomyAPI não configuradas.' },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const {
    latitude,
    longitude,
    date,
    rightAscension = 0,
    declination = 0,
    zoom = 3,
  } = body as {
    latitude?: number
    longitude?: number
    date?: string
    rightAscension?: number
    declination?: number
    zoom?: number
  }

  if (latitude == null || longitude == null || !date) {
    return Response.json(
      { error: 'Os campos latitude, longitude e date são obrigatórios.' },
      { status: 400 }
    )
  }

  // Formato exigido pelo header: Basic <base64(appId:appSecret)>
  const token = Buffer.from(`${appId}:${appSecret}`).toString('base64')

  const payload = {
    style: 'navy',
    observer: { latitude, longitude, date },
    view: {
      type: 'area',
      parameters: {
        position: {
          equatorial: { rightAscension, declination },
        },
        zoom,
      },
    },
  }

  const astronomyRes = await fetch(
    'https://api.astronomyapi.com/api/v2/studio/star-chart',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  if (!astronomyRes.ok) {
    const detail = await astronomyRes.text()
    return Response.json(
      { error: 'Erro retornado pela AstronomyAPI.', detail },
      { status: astronomyRes.status }
    )
  }

  const { data } = (await astronomyRes.json()) as { data: { imageUrl: string } }

  return Response.json({ imageUrl: data.imageUrl })
}
