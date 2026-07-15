import { cache } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/app/lib/supabase'
import { getPreco, formatPreco } from '@/app/lib/preco'
import ContadorTempo from './_components/ContadorTempo'
import AbrirPresente from './_components/AbrirPresente'
import SpotifyPlayer from './_components/SpotifyPlayer'
import PosterButton from './_components/PosterButton'

// ── Data fetching (deduplicated across generateMetadata + page) ──────────────

const getCasal = cache(async (slug: string) => {
  const { data, error } = await supabase
    .from('casais')
    .select('*')
    .eq('slug_pagina_exclusiva', slug)
    .single()
  return error ? null : data
})

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const casal = await getCasal(slug)

  if (!casal) {
    return {
      title: 'Céu Daquele Dia — Uma memória eterna sob as estrelas',
      description: 'Crie um mapa estelar personalizado e romântico para celebrar o dia mais especial da sua história de amor.',
    }
  }

  const title       = `O Céu de ${casal.nome_parceiro_1} & ${casal.nome_parceiro_2}`
  const description = `Veja o presente especial e o mapa estelar personalizado que criamos para celebrar a nossa história de amor. ✨`
  // Prioridade de imagem: foto do casal → mapa estelar → imagem padrão
  const ogImage     = casal.url_foto_casal ?? casal.url_imagem_ceu ?? '/og-default.jpg'
  const ogImageAlt  = `${casal.nome_parceiro_1} & ${casal.nome_parceiro_2} — Céu Daquele Dia`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatarDataBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`
}

function calcularFaseLua(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00Z')
  const luaNovaRef = new Date('2000-01-06T18:14:00Z')
  const CICLO = 29.53058770576
  const dias = (date.getTime() - luaNovaRef.getTime()) / 86_400_000
  const pos = ((dias % CICLO) + CICLO) % CICLO
  const iluminacao = Math.round(((1 - Math.cos((2 * Math.PI * pos) / CICLO)) / 2) * 100)
  const eMinguante = pos > CICLO / 2
  const nome =
    pos < 1.85  ? 'Lua Nova'         :
    pos < 7.38  ? 'Lua Crescente'    :
    pos < 9.22  ? 'Quarto Crescente' :
    pos < 14.77 ? 'Gibosa Crescente' :
    pos < 16.61 ? 'Lua Cheia'        :
    pos < 22.15 ? 'Gibosa Minguante' :
    pos < 23.99 ? 'Quarto Minguante' :
                  'Lua Minguante'
  return { nome, iluminacao, eMinguante }
}


// ── MoonSvg (server-safe — static IDs, single instance per page) ─────────────

function MoonSvg({ iluminacao, eMinguante }: { iluminacao: number; eMinguante: boolean }) {
  const r = 24
  const cx = 28
  const cy = 28
  const shadowCx = eMinguante ? cx + 2 * r * (iluminacao / 100) : cx - 2 * r * (iluminacao / 100)

  return (
    <svg viewBox="0 0 56 56" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="moon-mask-public">
          <circle cx={cx} cy={cy} r={r} fill="white" />
          <circle cx={shadowCx} cy={cy} r={r} fill="black" />
        </mask>
        <radialGradient id="moon-grad-public" cx="42%" cy="38%" r="60%">
          <stop offset="0%"   stopColor="#fef9c3" />
          <stop offset="65%"  stopColor="#f5d78e" />
          <stop offset="100%" stopColor="#d4a84b" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#060e1c" />
      <circle cx={cx} cy={cy} r={r} fill="url(#moon-grad-public)" mask="url(#moon-mask-public)" />
    </svg>
  )
}

// ── Error Screens ─────────────────────────────────────────────────────────────

function TelaNotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #0d0d28 0%, #07071a 100%)' }}
    >
      {/* Top nebula */}
      <div
        className="fixed top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(124,58,237,0.18) 0%, transparent 70%)' }}
      />
      <div className="relative text-center max-w-sm animate-fadein-up">
        <p className="text-violet-400/30 text-3xl tracking-[12px] mb-8">✦ · · · ✦</p>
        <div className="text-7xl mb-6">🌌</div>
        <h1 className="font-display text-4xl italic text-star mb-4 leading-tight">
          Página não encontrada
        </h1>
        <p className="text-stardust text-sm font-sans leading-relaxed mb-8">
          Este endereço não corresponde a nenhum céu em nossa constelação.
          Verifique o link que você recebeu por e-mail.
        </p>
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg"
        >
          Criar o meu céu
        </Link>
      </div>
    </main>
  )
}

function TelaAguardandoPagamento({ nome1, nome2 }: { nome1: string; nome2: string }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #0d0d28 0%, #07071a 100%)' }}
    >
      <div
        className="fixed top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(124,58,237,0.18) 0%, transparent 70%)' }}
      />
      <div className="relative text-center max-w-sm animate-fadein-up">
        <p className="text-violet-400/30 text-3xl tracking-[12px] mb-8">✦ · · · ✦</p>
        <div className="text-7xl mb-6">⏳</div>
        <h1 className="font-display text-4xl italic text-star mb-4 leading-tight">
          Aguardando confirmação
        </h1>
        <p className="text-stardust text-sm font-sans leading-relaxed mb-3">
          O céu de{' '}
          <strong className="text-star">{nome1} &amp; {nome2}</strong>{' '}
          está sendo preparado.
        </p>
        <p className="text-nebula text-sm font-sans leading-relaxed mb-8">
          Assim que o pagamento for confirmado, você receberá um e-mail com o link da sua página especial. 💜
        </p>
        <div
          className="rounded-2xl p-4 border border-violet-500/10"
          style={{ background: 'rgba(13,13,40,0.6)' }}
        >
          <p className="text-nebula text-xs font-sans leading-relaxed">
            Pix: confirmação em instantes · Cartão: pode levar até 1 hora.
          </p>
        </div>
      </div>
    </main>
  )
}

function TelaExpirada({ nome1, nome2, slug, precoFormatado }: { nome1: string; nome2: string; slug: string; precoFormatado: string }) {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #0d0d28 0%, #07071a 100%)' }}
    >
      <div
        className="fixed top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(245,215,142,0.08) 0%, transparent 70%)' }}
      />
      <div className="relative text-center max-w-sm animate-fadein-up">
        <p className="text-gold-400/30 text-3xl tracking-[12px] mb-8">✦ · · · ✦</p>
        <div className="text-7xl mb-6">🌙</div>
        <h1 className="font-display text-4xl italic text-star mb-4 leading-tight">
          As estrelas adormecer&shy;am...
        </h1>
        <p className="text-stardust text-sm font-sans leading-relaxed mb-3">
          A assinatura de{' '}
          <strong className="text-star">{nome1} &amp; {nome2}</strong>{' '}
          expirou, mas as memórias daquela noite existem para sempre.
        </p>
        <p className="text-nebula text-sm font-sans leading-relaxed mb-8">
          Renove por mais {precoFormatado} e desperte cada estrela daquele céu especial.
        </p>
        <Link
          href={`/renovar/${slug}`}
          className="block w-full text-center bg-gradient-to-r from-gold-500 to-gold-400 text-space-900 font-sans font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:opacity-90 mb-3 shadow-lg"
        >
          ✨ Renovar por {precoFormatado}
        </Link>
        <Link
          href="/"
          className="block w-full text-center border border-violet-500/25 hover:border-violet-500/50 text-stardust hover:text-star font-sans text-sm px-8 py-3 rounded-2xl transition-all duration-300"
        >
          Criar uma nova memória
        </Link>
      </div>
    </main>
  )
}

// ── Static star decorations (pre-computed to avoid hydration issues) ──────────

const STARS_DECO = [
  { top: '5%',  left: '8%',  size: 1,    delay: '0s',   dur: '3.2s', color: '#f0e6ff' },
  { top: '11%', left: '83%', size: 0.75, delay: '1.2s', dur: '4.5s', color: '#c4b5fd' },
  { top: '18%', left: '3%',  size: 1,    delay: '2.0s', dur: '2.8s', color: '#f5d78e' },
  { top: '25%', left: '91%', size: 0.5,  delay: '0.6s', dur: '5.0s', color: '#f0e6ff' },
  { top: '33%', left: '6%',  size: 0.75, delay: '3.2s', dur: '3.8s', color: '#c4b5fd' },
  { top: '42%', left: '95%', size: 1,    delay: '1.8s', dur: '4.2s', color: '#f5d78e' },
  { top: '50%', left: '1%',  size: 0.5,  delay: '0.4s', dur: '3.5s', color: '#f0e6ff' },
  { top: '58%', left: '88%', size: 0.75, delay: '2.5s', dur: '2.5s', color: '#c4b5fd' },
  { top: '67%', left: '5%',  size: 1,    delay: '1.5s', dur: '4.8s', color: '#f0e6ff' },
  { top: '74%', left: '92%', size: 0.5,  delay: '0.9s', dur: '3.0s', color: '#f5d78e' },
  { top: '82%', left: '8%',  size: 0.75, delay: '2.2s', dur: '5.5s', color: '#c4b5fd' },
  { top: '89%', left: '78%', size: 1,    delay: '1.1s', dur: '3.7s', color: '#f0e6ff' },
  { top: '95%', left: '42%', size: 0.5,  delay: '3.5s', dur: '4.0s', color: '#c4b5fd' },
  { top: '15%', left: '45%', size: 0.5,  delay: '4.0s', dur: '6.0s', color: '#f0e6ff' },
  { top: '48%', left: '15%', size: 0.5,  delay: '1.7s', dur: '4.3s', color: '#f5d78e' },
  { top: '72%', left: '55%', size: 0.5,  delay: '2.8s', dur: '3.2s', color: '#c4b5fd' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

function StarMapContent({ casal, dataFormatada }: {
  casal: NonNullable<Awaited<ReturnType<typeof getCasal>>>
  dataFormatada: string
}) {
  if (casal.url_imagem_ceu) {
    return (
      <img
        src={casal.url_imagem_ceu}
        alt={`Ceu de ${casal.local} em ${dataFormatada}`}
        className="w-full aspect-square rounded-full object-cover border border-blue-900/40"
        style={{ filter: 'brightness(1.25) contrast(1.45) saturate(1.6)' }}
      />
    )
  }
  return (
    <div
      className="w-full aspect-square rounded-full overflow-hidden border border-blue-900/40"
      style={{ background: 'radial-gradient(ellipse at 50% 45%, #0c1e3a 0%, #070e1f 60%, #04090f 100%)' }}
    >
      <svg className="w-full h-full" viewBox="0 0 200 200">
        {[38, 75, 113, 148].map((r, i) => (
          <circle key={i} cx={100} cy={100} r={r} fill="none" stroke="rgba(80,130,220,0.08)" strokeWidth="0.6" />
        ))}
        <circle cx={88}  cy={125} r={3.8} fill="#c8e8ff" />
        <circle cx={75}  cy={108} r={2.8} fill="#ffcc88" />
        <circle cx={115} cy={72}  r={2.5} fill="#c8e8ff" />
        <circle cx={148} cy={112} r={2.2} fill="#ffffff" />
        <line x1="88"  y1="125" x2="75"  y2="108" stroke="rgba(140,180,255,0.30)" strokeWidth="0.7" />
        <line x1="75"  y1="108" x2="95"  y2="92"  stroke="rgba(140,180,255,0.30)" strokeWidth="0.7" />
        <line x1="95"  y1="92"  x2="115" y2="72"  stroke="rgba(140,180,255,0.30)" strokeWidth="0.7" />
        <text x="100" y="11"  textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">N</text>
        <text x="100" y="197" textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">S</text>
        <text x="8"   y="103" textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">L</text>
        <text x="193" y="103" textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">O</text>
      </svg>
    </div>
  )
}

function PaginaCasal({ casal }: { casal: NonNullable<Awaited<ReturnType<typeof getCasal>>> }) {
  const lua = calcularFaseLua(casal.data_especial)
  const dataFormatada = formatarDataBR(casal.data_especial)
  const hasRightContent = !!(casal.url_foto_casal || casal.musica_preview_url || casal.mensagem_personalizada)
  const isShortMessage = (casal.mensagem_personalizada?.length ?? 0) < 100

  const faseLuaPanel = (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-4 border border-white/5"
      style={{ background: 'rgba(7,7,26,0.6)', backdropFilter: 'blur(12px)' }}
    >
      <div style={{ filter: 'drop-shadow(0 0 10px rgba(245,215,142,0.5))' }}>
        <MoonSvg iluminacao={lua.iluminacao} eMinguante={lua.eMinguante} />
      </div>
      <div>
        <p className="text-[10px] font-sans uppercase tracking-widest mb-1" style={{ color: '#6b5e8a' }}>
          Fase da lua naquela noite
        </p>
        <p className="font-display italic text-xl leading-tight" style={{ color: '#f5d78e' }}>
          {lua.nome}
        </p>
        <p className="text-sm font-sans mt-0.5" style={{ color: '#9b8cc0' }}>
          {lua.iluminacao}% iluminada
        </p>
      </div>
    </div>
  )

  const colunaCeu = (
    <div className="space-y-5 animate-fadein-up" style={{ animationDelay: '0.15s' }}>
      {/* Star map — 90 vw on mobile, fills column on desktop */}
      <div className="flex justify-center">
        <div className="relative w-[88vw] max-w-[340px] lg:max-w-none lg:w-full">
          <div
            className="absolute rounded-full animate-pulse-glow pointer-events-none"
            style={{
              inset: '-20px',
              background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)',
            }}
          />
          <StarMapContent casal={casal} dataFormatada={dataFormatada} />
        </div>
      </div>

      <p className="text-center text-xs font-sans" style={{ color: '#4a4070' }}>
        O céu de {casal.local} em {dataFormatada}
      </p>

      <ContadorTempo dataEspecial={casal.data_especial} />

      {faseLuaPanel}
    </div>
  )

  const colunaMemoria = (
    <div className="space-y-10 animate-fadein-up" style={{ animationDelay: '0.3s' }}>

      {/* Polaroid photo */}
      {casal.url_foto_casal && (
        <div className="flex justify-center">
          <div
            className="bg-white"
            style={{
              padding: '10px 10px 40px',
              transform: 'rotate(-2.5deg)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            <img
              src={casal.url_foto_casal}
              alt={`${casal.nome_parceiro_1} e ${casal.nome_parceiro_2}`}
              className="w-56 lg:w-64 aspect-square object-cover block"
            />
            <p
              className="text-center mt-2 text-[11px] tracking-wide"
              style={{ fontFamily: 'Georgia, serif', color: '#333' }}
            >
              {casal.nome_parceiro_1} &amp; {casal.nome_parceiro_2}
            </p>
          </div>
        </div>
      )}

      {/* Music player */}
      {casal.musica_preview_url && (
        <SpotifyPlayer
          previewUrl={casal.musica_preview_url}
          albumArt={casal.musica_capa}
          trackTitle={casal.musica_nome}
          artistName={casal.musica_artista}
        />
      )}

      {/* Love letter */}
      {casal.mensagem_personalizada && (
        isShortMessage ? (
          /* Mensagem curta — layout centralizado com fonte ampliada */
          <div
            className="rounded-2xl border border-violet-500/15 flex flex-col items-center justify-center text-center px-8 py-12"
            style={{
              background: 'rgba(13,13,40,0.5)',
              backdropFilter: 'blur(16px)',
              boxShadow: 'inset 0 1px 0 rgba(167,139,250,0.08)',
            }}
          >
            <span
              className="font-display text-4xl select-none leading-none mb-4"
              style={{ color: 'rgba(124,58,237,0.3)' }}
            >
              &ldquo;
            </span>
            <p className="font-display italic text-3xl leading-snug tracking-wide" style={{ color: '#c4b5fd' }}>
              {casal.mensagem_personalizada}
            </p>
            <span
              className="font-display text-4xl select-none leading-none mt-4"
              style={{ color: 'rgba(124,58,237,0.3)' }}
            >
              &rdquo;
            </span>
            <div className="mt-6 pt-4 border-t border-violet-500/10 w-full">
              <p className="font-display italic text-sm" style={{ color: '#6b5e8a' }}>
                — {casal.nome_parceiro_1} &amp; {casal.nome_parceiro_2}
              </p>
            </div>
          </div>
        ) : (
          /* Mensagem longa — layout original com aspas tipográficas grandes */
          <div
            className="rounded-2xl px-6 py-6 border border-violet-500/15"
            style={{
              background: 'rgba(13,13,40,0.5)',
              backdropFilter: 'blur(16px)',
              boxShadow: 'inset 0 1px 0 rgba(167,139,250,0.08)',
            }}
          >
            <div
              className="font-display leading-none text-7xl select-none mb-1"
              style={{ color: 'rgba(124,58,237,0.18)' }}
            >
              &ldquo;
            </div>
            <p className="font-display italic text-lg leading-relaxed" style={{ color: '#c4b5fd' }}>
              {casal.mensagem_personalizada}
            </p>
            <div
              className="font-display leading-none text-7xl select-none text-right mt-1"
              style={{ color: 'rgba(124,58,237,0.18)' }}
            >
              &rdquo;
            </div>
            <div className="mt-4 pt-4 border-t border-violet-500/10 text-right">
              <p className="font-display italic text-sm" style={{ color: '#6b5e8a' }}>
                — {casal.nome_parceiro_1} &amp; {casal.nome_parceiro_2}
              </p>
            </div>
          </div>
        )
      )}

    </div>
  )

  return (
    <main
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0d0d28 0%, #07071a 100%)' }}
    >
      {/* Welcome overlay */}
      <AbrirPresente
        nome1={casal.nome_parceiro_1}
        nome2={casal.nome_parceiro_2}
        temMusica={!!casal.musica_preview_url}
      />

      {/* Fixed nebula glow */}
      <div
        className="fixed top-0 left-0 right-0 h-72 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(124,58,237,0.22) 0%, transparent 70%)' }}
      />

      {/* Fixed micro-stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
        {STARS_DECO.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle"
            style={{
              top: s.top,
              left: s.left,
              width: `${s.size * 4}px`,
              height: `${s.size * 4}px`,
              background: s.color,
              opacity: 0.38,
              animationDelay: s.delay,
              animationDuration: s.dur,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 pt-4 lg:pt-8 pb-12">

        {/* Header — full-width, centered above grid */}
        <header className="text-center max-w-3xl mx-auto px-6 mb-12 lg:mb-16 animate-fadein-up">
          <p className="text-violet-400/40 text-xs tracking-[10px] uppercase font-sans mb-8">
            ✦ &nbsp; · &nbsp; · &nbsp; · &nbsp; ✦
          </p>

          <h1 className="font-display italic leading-tight mb-6" style={{ color: '#f0e6ff' }}>
            <span className="text-5xl lg:text-7xl block">{casal.nome_parceiro_1}</span>
            <span className="text-3xl lg:text-4xl block" style={{ color: '#6b5e8a' }}>&amp;</span>
            <span className="text-5xl lg:text-7xl block">{casal.nome_parceiro_2}</span>
          </h1>

          <div className="space-y-1.5">
            <p className="text-sm lg:text-base font-sans" style={{ color: '#9b8cc0' }}>{dataFormatada}</p>
            <p className="text-xs lg:text-sm font-sans" style={{ color: '#6b5e8a' }}>{casal.local}</p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.25))' }}
            />
            <span className="text-violet-400/30 text-xs">✦</span>
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to left, transparent, rgba(167,139,250,0.25))' }}
            />
          </div>
        </header>

        {/* Grid */}
        <div className="max-w-6xl mx-auto px-5 lg:px-12">
          {hasRightContent ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              {/* Left: sticky sky panel */}
              <div className="lg:sticky lg:top-8">
                {colunaCeu}
              </div>
              {/* Right: memories */}
              <div className="lg:pt-2">
                {colunaMemoria}
              </div>
            </div>
          ) : (
            /* No right content — single centred column */
            <div className="max-w-xl mx-auto">
              {colunaCeu}
            </div>
          )}
        </div>

        {/* Download poster — botão premium centralizado */}
        <div
          className="flex justify-center mt-12 mb-2 px-5 animate-fadein-up"
          style={{ animationDelay: '0.45s' }}
        >
          <PosterButton
            nome1={casal.nome_parceiro_1}
            nome2={casal.nome_parceiro_2}
            dataFormatada={dataFormatada}
            ano={casal.data_especial.split('-')[0]}
            localStr={casal.local}
            latitude={casal.latitude}
            longitude={casal.longitude}
            urlImagem={casal.url_imagem_ceu}
            urlFoto={casal.url_foto_casal}
            slug={casal.slug_pagina_exclusiva}
          />
        </div>

        {/* Footer */}
        <footer
          className="max-w-3xl mx-auto px-6 mt-8 animate-fadein-up"
          style={{ animationDelay: '0.55s' }}
        >
          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(107,94,138,0.25))' }} />
            <span className="text-xs" style={{ color: 'rgba(107,94,138,0.4)' }}>✦</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(107,94,138,0.25))' }} />
          </div>

          {/* Branding centralizado */}
          <div className="flex justify-center">
            <Link href="/" className="hover:opacity-80 transition-opacity text-center">
              <p className="font-display italic text-xl" style={{ color: '#9b8cc0' }}>Céu Daquele Dia</p>
              <p className="text-xs font-sans mt-0.5" style={{ color: '#3a3060' }}>
                Uma memória eterna sob as estrelas
              </p>
            </Link>
          </div>

          <p className="text-xs font-sans mt-3" style={{ color: '#2a2060' }}>
            Assinatura anual · Renovável em{' '}
            {new Date(casal.data_expiracao).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </footer>

      </div>
    </main>
  )
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default async function CasalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const casal = await getCasal(slug)

  if (!casal) return <TelaNotFound />

  if (casal.status_pagamento !== 'approved') {
    return (
      <TelaAguardandoPagamento
        nome1={casal.nome_parceiro_1}
        nome2={casal.nome_parceiro_2}
      />
    )
  }

  if (new Date(casal.data_expiracao) < new Date()) {
    const precoFormatado = formatPreco(await getPreco())
    return (
      <TelaExpirada
        nome1={casal.nome_parceiro_1}
        nome2={casal.nome_parceiro_2}
        slug={casal.slug_pagina_exclusiva}
        precoFormatado={precoFormatado}
      />
    )
  }

  return <PaginaCasal casal={casal} />
}
