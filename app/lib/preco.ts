import { connection } from 'next/server'
import { unstable_cache } from 'next/cache'
import { supabase } from './supabase'

// Consulta o preço no banco. Fica em cache no servidor (Data Cache) por 5 min
// (revalidate), então sob carga alta o Supabase é consultado no máximo 1x por
// janela — e não 1x por request. O cache é reciclado sozinho a cada 5 min; para
// atualizar na hora, basta um novo deploy (limpa o Data Cache do servidor).
const getPrecoCached = unstable_cache(
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
  ['preco'], // prefixo da chave de cache
  { tags: ['preco'], revalidate: 300 },
)

export async function getPreco(): Promise<number> {
  // Impede que o Next.js pré-renderize (e congele) o preço no build.
  // Sem isso, o valor consultado no build fica estático em produção.
  await connection()
  return getPrecoCached()
}

export function formatPreco(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
