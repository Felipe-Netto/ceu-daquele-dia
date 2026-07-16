import { unstable_cache } from 'next/cache'
import { supabase } from './supabase'

// Lê o banco no máximo uma vez por hora independente de quantas requests chegarem.
// unstable_cache persiste entre requests (diferente de React.cache, que só dura 1 request).
const fetchPrecoFromDB = unstable_cache(
  async (): Promise<number> => {
    const { data } = await supabase
      .from('configuracoes')
      .select('preco')
      .eq('chave', 'mapa_estelar')
      .single()

    const valor = Number(data?.preco)
    if (!isFinite(valor) || valor <= 0) throw new Error('Preço não configurado no banco de dados.')
    return valor
  },
  ['configuracoes-preco-mapa-estelar'],
  { revalidate: 3600 } // TTL de 1 hora
)

export async function getPreco(): Promise<number> {
  return fetchPrecoFromDB()
}

export function formatPreco(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
