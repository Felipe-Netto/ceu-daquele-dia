import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabase'
import type { Casal } from '@/app/lib/supabase'
import EditarForm from './_components/EditarForm'

// ── Data fetching ─────────────────────────────────────────────────────────────

const getCasalPorToken = cache(async (token: string): Promise<Casal | null> => {
  const { data, error } = await supabase
    .from('casais')
    .select('*')
    .eq('token_edicao', token)
    .single()
  return error ? null : (data as Casal)
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Editar Página — Céu Daquele Dia',
  robots: { index: false, follow: false },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EditarPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const casal = await getCasalPorToken(token)

  if (!casal) return <TelaTokenInvalido />

  return <EditarForm casal={casal} />
}

// ── Token inválido ────────────────────────────────────────────────────────────

function TelaTokenInvalido() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #04040f 0%, #07071a 60%, #0d0d28 100%)' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(124,58,237,0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative text-center max-w-sm animate-fadein-up">
        <div className="text-6xl mb-7">🔒</div>

        <p className="text-violet-400 text-[10px] tracking-[6px] uppercase font-sans mb-5">
          ✦ &nbsp; Link inválido &nbsp; ✦
        </p>

        <h1 className="font-display text-3xl text-star mb-4 leading-tight">
          Link de edição inválido ou expirado
        </h1>

        <p className="text-stardust text-sm font-sans leading-relaxed mb-8">
          Este link não existe ou pode ter expirado. Verifique o e-mail que você
          recebeu ao criar a página de vocês — o link de edição está lá.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold text-sm px-8 py-3.5 rounded-full transition-all duration-300"
          style={{ boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}
        >
          Criar uma nova página →
        </Link>
      </div>
    </main>
  )
}
