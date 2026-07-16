import { getPreco, formatPreco } from '@/app/lib/preco'
import CriarForm from './_components/CriarForm'

export default async function CriarPage() {
  const preco = await getPreco()
  return <CriarForm preco={preco} precoFormatado={formatPreco(preco)}/>
}
