import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new Response('Missing url', { status: 400 })

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return new Response('Protocol not allowed', { status: 400 })
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'CeuDaqueleDia/1.0' },
      next: { revalidate: 86400 },
    })

    if (!upstream.ok) {
      return new Response('Failed to fetch image', { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png'
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 400 })
    }

    const buffer = await upstream.arrayBuffer()

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new Response('Error fetching image', { status: 500 })
  }
}
