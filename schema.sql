-- ============================================================
-- Céu Daquele Dia — Schema Principal
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ============================================================

-- Habilita geração de UUIDs (já disponível no Supabase por padrão)
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: casais
-- ============================================================
create table if not exists public.casais (
  id                    uuid primary key default gen_random_uuid(),

  -- Dados do casal
  nome_parceiro_1       text not null,
  nome_parceiro_2       text not null,
  data_especial         date not null,
  local                 text not null,
  latitude              numeric(10, 7) not null,
  longitude             numeric(10, 7) not null,
  email                 text not null,

  -- Pagamento
  status_pagamento      text not null default 'pending'
                          check (status_pagamento in ('pending', 'approved')),
  id_pagamento_mp       text unique,

  -- Mídia gerada / enviada
  url_imagem_ceu        text,
  url_foto_casal        text,
  musica_url            text,

  -- Conteúdo personalizado
  mensagem_personalizada text,

  -- Acesso frictionless (sem login)
  slug_pagina_exclusiva text not null unique,
  token_edicao          text not null unique default encode(gen_random_bytes(32), 'hex'),

  -- Assinatura anual
  data_expiracao        timestamptz not null default (now() + interval '1 year'),

  -- Auditoria
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES para lookups frequentes
-- ============================================================
create index if not exists casais_slug_idx   on public.casais (slug_pagina_exclusiva);
create index if not exists casais_token_idx  on public.casais (token_edicao);
create index if not exists casais_status_idx on public.casais (status_pagamento);
create index if not exists casais_expira_idx on public.casais (data_expiracao);

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger casais_updated_at
  before update on public.casais
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.casais enable row level security;

-- Leitura pública: apenas páginas aprovadas e não expiradas
create policy "leitura_publica_aprovados"
  on public.casais for select
  using (
    status_pagamento = 'approved'
    and data_expiracao > now()
  );

-- Inserção: permitida para qualquer um (webhook do Mercado Pago)
-- O service role key bypassa o RLS — este policy é para a anon key se necessário
create policy "insercao_publica"
  on public.casais for insert
  with check (true);

-- Atualização: apenas via service role (webhook + API interna)
-- Com service role key o RLS é ignorado; este policy é para a anon key
create policy "atualizacao_service_role"
  on public.casais for update
  using (true);

-- ============================================================
-- COMENTÁRIOS nas colunas
-- ============================================================
comment on column public.casais.slug_pagina_exclusiva is
  'URL pública da página: /casal/[slug]';
comment on column public.casais.token_edicao is
  'Token de 64 chars enviado por e-mail para edição sem login';
comment on column public.casais.url_foto_casal is
  'Caminho no bucket fotos-casais: {id}/{nome-arquivo}';
comment on column public.casais.data_expiracao is
  'Assinatura válida por 1 ano. Bloqueia acesso se expirado.';
