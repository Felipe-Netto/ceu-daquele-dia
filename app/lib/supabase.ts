import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.')
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export type StatusPagamento = 'pending' | 'approved'

export interface Casal {
  id: string
  nome_parceiro_1: string
  nome_parceiro_2: string
  data_especial: string
  local: string
  latitude: number
  longitude: number
  email: string
  status_pagamento: StatusPagamento
  id_pagamento_mp: string | null
  url_imagem_ceu: string | null
  url_foto_casal: string | null
  musica_url: string | null
  mensagem_personalizada: string | null
  slug_pagina_exclusiva: string
  token_edicao: string
  data_expiracao: string
  created_at: string
  updated_at: string
}
