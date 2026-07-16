import { getPreco } from '@/app/lib/preco'

export const dynamic = 'force-dynamic'

export async function GET() {
  const preco = await getPreco()
  return Response.json({ preco })
}
