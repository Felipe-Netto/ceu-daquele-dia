import { getPreco } from '@/app/lib/preco'

export async function GET() {
  const preco = await getPreco()
  return Response.json({ preco }, {
    headers: {
      // Browser e CDN guardam a resposta por 1 hora — sem chamar a API de novo.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
