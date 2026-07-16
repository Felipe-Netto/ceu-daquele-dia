import { supabase } from './supabase'

export async function getPreco(): Promise<number> {
  const { data } = await supabase
    .from('configuracoes')
    .select('preco')
    .eq('chave', 'mapa_estelar')
    .single()

  const valor = Number(data?.preco)
  if (!isFinite(valor) || valor <= 0) throw new Error('Preço não configurado no banco de dados.')
  return valor
}

export function formatPreco(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
