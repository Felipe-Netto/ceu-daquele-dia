'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { compressImage } from '@/app/lib/compress-image'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MpInstance {
  createCardToken(data: Record<string, string>): Promise<{ id: string }>
  getInstallments(data: { amount: string; bin: string; paymentTypeId: string }): Promise<
    Array<{ payer_costs: Array<{ installments: number; recommended_message: string }> }>
  >
  getPaymentMethods(data: { bin: string }): Promise<{ results: Array<{ id: string }> }>
}

declare global {
  interface Window { MercadoPago: new (key: string, opts?: { locale: string }) => MpInstance }
}

interface CartaoResultado {
  status: 'approved' | 'in_process' | 'pending' | 'rejected'
  slug: string
  mensagem: string
}

interface Municipio {
  id: number
  nome: string
  microrregiao: { mesorregiao: { UF: { sigla: string } } }
}

interface MusicaResult {
  id: string
  nome: string
  artista: string
  capaUrl: string
  trackUrl?: string
  previewUrl: string | null
}

interface FormState {
  nomeCidade: string
  latitude: number | null
  longitude: number | null
  data: string
  hora: string
  nomeParceiro1: string
  nomeParceiro2: string
  mensagem: string
  musicaUrl: string
  musicaNome: string
  musicaArtista: string
  musicaCapa: string
  email: string
}

interface FaseLua {
  nome: string
  iluminacao: number
  eMinguante: boolean
}

interface PixData {
  qrCode: string
  qrCodeBase64: string
  slug: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function calcularFaseLua(dateStr: string): FaseLua {
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

function formatarDataBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]} de ${y}`
}

// ── MoonSvg ───────────────────────────────────────────────────────────────────
// Uses an SVG mask: white disc − black shadow circle = lit crescent/gibbous.
// For waxing (eMinguante=false): shadow center moves left as illumination grows.
// For waning (eMinguante=true): mirror image — shadow center moves right.

function MoonSvg({ iluminacao, eMinguante }: { iluminacao: number; eMinguante: boolean }) {
  const uid = useId()
  const r = 18
  const cx = 22
  const cy = 22
  const f = iluminacao / 100
  const shadowCx = eMinguante ? cx + 2 * r * f : cx - 2 * r * f

  return (
    <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id={`mm${uid}`}>
          <circle cx={cx} cy={cy} r={r} fill="white" />
          <circle cx={shadowCx} cy={cy} r={r} fill="black" />
        </mask>
        <radialGradient id={`mg${uid}`} cx="42%" cy="38%" r="60%">
          <stop offset="0%"   stopColor="#fef9c3" />
          <stop offset="65%"  stopColor="#f5d78e" />
          <stop offset="100%" stopColor="#d4a84b" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#060e1c" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#mg${uid})`} mask={`url(#mm${uid})`} />
    </svg>
  )
}

// ── StarMapPlaceholder ─────────────────────────────────────────────────────────

const PLACEHOLDER_STARS: { cx: number; cy: number; r: number; o: number }[] = [
  { cx: 40,  cy: 25,  r: 0.8, o: 0.6 }, { cx: 65,  cy: 22,  r: 1.0, o: 0.7 },
  { cx: 90,  cy: 28,  r: 0.7, o: 0.5 }, { cx: 35,  cy: 50,  r: 0.9, o: 0.6 },
  { cx: 58,  cy: 45,  r: 0.7, o: 0.5 }, { cx: 88,  cy: 42,  r: 0.8, o: 0.6 },
  { cx: 115, cy: 35,  r: 1.1, o: 0.7 }, { cx: 148, cy: 50,  r: 0.8, o: 0.6 },
  { cx: 168, cy: 28,  r: 0.7, o: 0.5 }, { cx: 20,  cy: 75,  r: 0.9, o: 0.5 },
  { cx: 48,  cy: 68,  r: 0.8, o: 0.6 }, { cx: 78,  cy: 72,  r: 1.0, o: 0.6 },
  { cx: 112, cy: 68,  r: 0.7, o: 0.5 }, { cx: 145, cy: 72,  r: 0.9, o: 0.6 },
  { cx: 168, cy: 60,  r: 0.8, o: 0.5 }, { cx: 185, cy: 75,  r: 0.7, o: 0.5 },
  { cx: 15,  cy: 100, r: 0.7, o: 0.5 }, { cx: 42,  cy: 95,  r: 0.8, o: 0.6 },
  { cx: 80,  cy: 92,  r: 1.1, o: 0.7 }, { cx: 132, cy: 95,  r: 0.7, o: 0.5 },
  { cx: 160, cy: 88,  r: 0.9, o: 0.6 }, { cx: 182, cy: 100, r: 0.8, o: 0.5 },
  { cx: 25,  cy: 125, r: 0.8, o: 0.5 }, { cx: 60,  cy: 118, r: 0.7, o: 0.6 },
  { cx: 98,  cy: 115, r: 0.9, o: 0.6 }, { cx: 130, cy: 118, r: 0.8, o: 0.5 },
  { cx: 162, cy: 115, r: 0.7, o: 0.5 }, { cx: 185, cy: 125, r: 0.8, o: 0.5 },
  { cx: 20,  cy: 148, r: 0.9, o: 0.5 }, { cx: 55,  cy: 145, r: 0.8, o: 0.6 },
  { cx: 95,  cy: 150, r: 0.7, o: 0.5 }, { cx: 128, cy: 148, r: 0.9, o: 0.6 },
  { cx: 162, cy: 145, r: 0.8, o: 0.5 }, { cx: 185, cy: 152, r: 0.7, o: 0.5 },
  { cx: 30,  cy: 172, r: 0.8, o: 0.5 }, { cx: 65,  cy: 168, r: 0.7, o: 0.6 },
  { cx: 102, cy: 175, r: 0.9, o: 0.6 }, { cx: 138, cy: 172, r: 0.8, o: 0.5 },
  { cx: 170, cy: 168, r: 0.7, o: 0.5 }, { cx: 35,  cy: 190, r: 0.7, o: 0.5 },
  { cx: 72,  cy: 188, r: 0.8, o: 0.6 }, { cx: 112, cy: 192, r: 0.7, o: 0.5 },
  { cx: 148, cy: 190, r: 0.8, o: 0.5 }, { cx: 178, cy: 185, r: 0.7, o: 0.5 },
]

function StarMapPlaceholder({ loading, dateLabel }: { loading?: boolean; dateLabel?: string }) {
  return (
    <div className="relative w-full aspect-square rounded-full overflow-hidden border border-blue-900/40"
      style={{ background: 'radial-gradient(ellipse at 50% 45%, #0c1e3a 0%, #070e1f 60%, #04090f 100%)' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        {/* Grid circles */}
        {[38, 75, 113, 148].map((r, i) => (
          <circle key={i} cx={100} cy={100} r={r} fill="none" stroke="rgba(80,130,220,0.08)" strokeWidth="0.6" />
        ))}
        {/* Background stars */}
        {PLACEHOLDER_STARS.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.o} />
        ))}
        {/* Bright featured stars */}
        <circle cx={88}  cy={125} r={3.8} fill="#c8e8ff" />
        <circle cx={75}  cy={108} r={2.8} fill="#ffcc88" />
        <circle cx={115} cy={72}  r={2.5} fill="#c8e8ff" />
        <circle cx={148} cy={112} r={2.2} fill="#ffffff" />
        {/* Constellation lines */}
        <line x1="88"  y1="125" x2="75"  y2="108" stroke="rgba(140,180,255,0.30)" strokeWidth="0.7" />
        <line x1="75"  y1="108" x2="95"  y2="92"  stroke="rgba(140,180,255,0.30)" strokeWidth="0.7" />
        <line x1="95"  y1="92"  x2="115" y2="72"  stroke="rgba(140,180,255,0.30)" strokeWidth="0.7" />
        {/* Milky Way hint */}
        <ellipse cx={110} cy={100} rx={20} ry={90} fill="rgba(180,200,255,0.018)" transform="rotate(-25 100 100)" />
        {/* Compass */}
        <text x="100" y="11"   textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">N</text>
        <text x="100" y="197" textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">S</text>
        <text x="8"   y="103" textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">L</text>
        <text x="193" y="103" textAnchor="middle" fontSize="8" fill="rgba(140,180,255,0.7)" fontFamily="monospace">O</text>
        {dateLabel && (
          <text x="100" y="188" textAnchor="middle" fontSize="5.5" fill="rgba(140,180,255,0.40)" fontFamily="monospace">
            {dateLabel}
          </text>
        )}
      </svg>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-space-900/70">
          <div className="w-5 h-5 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          <p className="text-violet-300 text-xs font-sans text-center px-6 leading-relaxed">
            Buscando a posição das estrelas...
          </p>
        </div>
      )}
    </div>
  )
}

// ── CidadeInput ────────────────────────────────────────────────────────────────

function CidadeInput({
  onSelect,
  hasError,
}: {
  onSelect: (nome: string, uf: string, displayName: string) => void
  hasError?: boolean
}) {
  const [query, setQuery] = useState('')
  const [sugestoes, setSugestoes] = useState<Municipio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const municipiosRef = useRef<Municipio[] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setSugestoes([]); setAberto(false); return }

    if (!municipiosRef.current) {
      setCarregando(true)
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
        municipiosRef.current = await res.json()
      } catch {
        setCarregando(false)
        return
      }
      setCarregando(false)
    }

    const qNorm = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const filtrados = municipiosRef.current!
      .filter(m =>
        m.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(qNorm)
      )
      .slice(0, 8)

    setSugestoes(filtrados)
    setAberto(filtrados.length > 0)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => buscar(query), 300)
    return () => clearTimeout(t)
  }, [query, buscar])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selecionar = (m: Municipio) => {
    const uf = m.microrregiao.mesorregiao.UF.sigla
    const displayName = `${m.nome} — ${uf}`
    setQuery(displayName)
    setSugestoes([])
    setAberto(false)
    onSelect(m.nome, uf, displayName)
  }

  const borderClass = hasError
    ? 'border-red-500/50 focus:border-red-400'
    : 'border-violet-500/25 focus:border-violet-500/60'

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setAberto(false) }}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          placeholder="Ex: Florianópolis"
          className={`w-full bg-space-800 border ${borderClass} text-star placeholder-nebula rounded-xl px-4 py-3 font-sans text-sm outline-none transition-colors pr-10`}
        />
        {carregando && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {aberto && sugestoes.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-space-800 border border-violet-500/30 rounded-xl overflow-hidden shadow-2xl">
          {sugestoes.map(m => {
            const uf = m.microrregiao.mesorregiao.UF.sigla
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => selecionar(m)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-space-700 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <span className="text-star text-sm font-sans">{m.nome}</span>
                <span className="text-nebula text-xs font-sans font-semibold ml-3 flex-shrink-0">{uf}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── MusicaInput ───────────────────────────────────────────────────────────────

function MusicaInput({ onSelect }: { onSelect: (track: MusicaResult) => void }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<MusicaResult[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [selecionada, setSelecionada] = useState<MusicaResult | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Para e destrói o áudio ao desmontar
  useEffect(() => () => { audioRef.current?.pause() }, [])

  const pararAudio = useCallback(() => {
    audioRef.current?.pause()
    setPlayingId(null)
  }, [])

  const togglePlay = useCallback((track: MusicaResult, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!track.previewUrl) return

    if (playingId === track.id) {
      pararAudio()
      return
    }

    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.pause()
    audioRef.current.src = track.previewUrl
    audioRef.current.volume = 0.75
    audioRef.current.onended = () => setPlayingId(null)
    audioRef.current.play().catch(() => {/* autoplay bloqueado — improvável com click */})
    setPlayingId(track.id)
  }, [playingId, pararAudio])

  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setResultados([]); setAberto(false); return }
    setCarregando(true)
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      const tracks: MusicaResult[] = data.tracks ?? []
      setResultados(tracks)
      setAberto(tracks.length > 0)
    } catch {/* silently fail */}
    finally { setCarregando(false) }
  }, [])

  useEffect(() => {
    if (selecionada) return
    const t = setTimeout(() => buscar(query), 400)
    return () => clearTimeout(t)
  }, [query, buscar, selecionada])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
        pararAudio()
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [pararAudio])

  const selecionar = (track: MusicaResult) => {
    pararAudio()
    setSelecionada(track)
    setQuery(track.nome)
    setAberto(false)
    onSelect(track)
  }

  const limpar = () => {
    pararAudio()
    setSelecionada(null)
    setQuery('')
    setResultados([])
    setAberto(false)
    onSelect({ id: '', nome: '', artista: '', capaUrl: '', trackUrl: '', previewUrl: null })
  }

  const PlayPauseBtn = ({
    track,
    size = 'sm',
  }: {
    track: MusicaResult
    size?: 'sm' | 'md'
  }) => {
    if (!track.previewUrl) return null
    const playing = playingId === track.id
    const dim = size === 'md' ? 'w-9 h-9 text-sm' : 'w-8 h-8 text-xs'
    return (
      <button
        type="button"
        onClick={e => togglePlay(track, e)}
        aria-label={playing ? 'Pausar' : 'Ouvir prévia de 30s'}
        className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200`}
        style={{
          background: playing ? 'rgba(30,215,96,0.28)' : 'rgba(30,215,96,0.12)',
          border: `1px solid ${playing ? 'rgba(30,215,96,0.55)' : 'rgba(30,215,96,0.22)'}`,
          color: '#1ed760',
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative">

      {/* ── Chip da faixa selecionada ── */}
      {selecionada ? (
        <div className="flex items-center gap-3 bg-space-800 border border-violet-500/30 rounded-xl px-4 py-3">
          {selecionada.capaUrl && (
            <img
              src={selecionada.capaUrl}
              alt={selecionada.nome}
              className="w-10 h-10 rounded-lg flex-shrink-0 object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-star text-sm font-sans font-medium truncate">{selecionada.nome}</p>
            <p className="text-nebula text-xs font-sans truncate mt-0.5">{selecionada.artista}</p>
          </div>
          <PlayPauseBtn track={selecionada} size="md" />
          <button
            type="button"
            onClick={limpar}
            className="flex-shrink-0 text-nebula hover:text-stardust text-xl leading-none transition-colors"
            aria-label="Remover música"
          >
            ×
          </button>
        </div>
      ) : (
        /* ── Campo de busca ── */
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nebula text-sm pointer-events-none">
            🎵
          </span>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelecionada(null) }}
            onFocus={() => resultados.length > 0 && setAberto(true)}
            placeholder="Buscar por música ou artista…"
            className="w-full bg-space-800 border border-violet-500/25 focus:border-violet-500/60 text-star placeholder-nebula rounded-xl pl-9 pr-10 py-3 font-sans text-sm outline-none transition-colors"
          />
          {carregando && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* ── Dropdown de resultados ── */}
      {aberto && resultados.length > 0 && !selecionada && (
        <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-space-800 border border-violet-500/30 rounded-xl overflow-hidden shadow-2xl">
          {resultados.map(track => (
            <div
              key={track.id}
              onClick={() => selecionar(track)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-space-700 transition-colors cursor-pointer border-b border-white/5 last:border-0"
            >
              {track.capaUrl ? (
                <img
                  src={track.capaUrl}
                  alt={track.nome}
                  className="w-10 h-10 rounded-lg flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-space-700 border border-violet-500/20 flex items-center justify-center text-sm">
                  🎵
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-star text-sm font-sans truncate">{track.nome}</p>
                <p className="text-nebula text-xs font-sans truncate mt-0.5">{track.artista}</p>
              </div>
              <PlayPauseBtn track={track} />
            </div>
          ))}
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-nebula text-[10px] font-sans">
              Clique na linha para selecionar · ▶ para ouvir prévia de 30s
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── LivePreview ────────────────────────────────────────────────────────────────

function LivePreview({
  formState,
  fotoPreview,
  starMapUrl,
  faseLua,
  isLoadingMap,
}: {
  formState: FormState
  fotoPreview: string | null
  starMapUrl: string | null
  faseLua: FaseLua | null
  isLoadingMap: boolean
}) {
  const nome1 = formState.nomeParceiro1 || 'Nome 1'
  const nome2 = formState.nomeParceiro2 || 'Nome 2'
  const local = formState.nomeCidade || 'Sua cidade, XX'
  const dataLabel = formState.data ? formatarDataBR(formState.data) : 'A noite especial'
  const lua = faseLua ?? { nome: 'Lua Cheia', iluminacao: 100, eMinguante: false }

  return (
    <div className="sticky top-6 space-y-4">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-glow" />
        <span className="text-violet-400 text-xs font-sans tracking-wider uppercase">
          Preview em tempo real
        </span>
      </div>

      {/* Card */}
      <div className="relative rounded-3xl overflow-hidden border border-violet-500/20 shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #0d0d28 0%, #07071a 100%)' }}>
        {/* Top nebula */}
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />

        <div className="relative z-10 p-6 space-y-5">
          {/* Star map */}
          <div className="flex justify-center">
            <div className="w-52 h-52">
              {starMapUrl ? (
                <img
                  src={starMapUrl}
                  alt="Mapa estelar"
                  className="w-full h-full rounded-full object-cover border border-blue-900/50"
                  style={{ filter: 'brightness(1.25) contrast(1.45) saturate(1.6)' }}
                />
              ) : (
                <StarMapPlaceholder
                  loading={isLoadingMap}
                  dateLabel={formState.data ? formatarDataBR(formState.data) : undefined}
                />
              )}
            </div>
          </div>

          {/* Couple photo */}
          {fotoPreview && (
            <div className="flex justify-center">
              <div
                className="bg-white shadow-xl"
                style={{ padding: '8px 8px 28px', transform: 'rotate(-2deg)', width: '110px' }}
              >
                <img
                  src={fotoPreview}
                  alt="Foto do casal"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
          )}

          {/* Names & date */}
          <div className="text-center">
            <p className="font-display text-2xl italic"
              style={{ color: '#f0e6ff' }}>
              {nome1} &amp; {nome2}
            </p>
            <p className="text-xs font-sans mt-1" style={{ color: '#9b8cc0' }}>{dataLabel}</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: '#6b5e8a' }}>{local}</p>
          </div>

          {/* Moon phase */}
          <div className="flex items-center justify-center gap-3 rounded-2xl px-4 py-3 border border-white/5"
            style={{ background: 'rgba(7,7,26,0.6)' }}>
            <div style={{ filter: 'drop-shadow(0 0 8px rgba(245,215,142,0.4))' }}>
              <MoonSvg iluminacao={lua.iluminacao} eMinguante={lua.eMinguante} />
            </div>
            <div>
              <p className="font-display italic text-sm" style={{ color: '#f5d78e' }}>{lua.nome}</p>
              <p className="text-xs font-sans" style={{ color: '#9b8cc0' }}>{lua.iluminacao}% iluminada</p>
            </div>
          </div>

          {/* Music */}
          {formState.musicaNome && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-white/5"
              style={{ background: 'rgba(7,7,26,0.8)' }}>
              {formState.musicaCapa ? (
                <img
                  src={formState.musicaCapa}
                  alt={formState.musicaNome}
                  className="w-10 h-10 rounded-lg flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                  style={{ background: 'rgba(30,215,96,0.12)', border: '1px solid rgba(30,215,96,0.2)' }}>
                  🎵
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans truncate font-medium" style={{ color: '#f0e6ff' }}>
                  {formState.musicaNome || 'Nossa Música Especial'}
                </p>
                {formState.musicaArtista && (
                  <p className="text-xs font-sans truncate mt-0.5" style={{ color: '#9b8cc0' }}>
                    {formState.musicaArtista}
                  </p>
                )}
                <div className="mt-1.5 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full w-1/3 rounded-full" style={{ background: 'rgba(30,215,96,0.5)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Message preview */}
          {formState.mensagem && (
            <div className="rounded-xl p-3 border border-violet-500/10"
              style={{ background: 'rgba(7,7,26,0.4)' }}>
              <p className="text-xs font-sans italic leading-relaxed line-clamp-3" style={{ color: '#9b8cc0' }}>
                &ldquo;{formState.mensagem}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs font-sans" style={{ color: '#6b5e8a' }}>
        R$ 29,90 · Acesso por 12 meses · Renovável
      </p>
    </div>
  )
}

// ── PixModal ───────────────────────────────────────────────────────────────────

function PixModal({ pixData, onClose }: { pixData: PixData; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixData.qrCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {/* clipboard not available */}
  }, [pixData.qrCode])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(7,7,26,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-sm bg-space-800 rounded-3xl border border-violet-500/30 p-7 shadow-2xl text-center">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-nebula hover:text-stardust text-2xl leading-none transition-colors"
          aria-label="Fechar"
        >
          ×
        </button>

        {/* Decorative stars */}
        <div className="absolute top-8 left-10 w-1 h-1 rounded-full bg-gold-400 animate-pulse-glow" />
        <div className="absolute top-12 right-14 w-1 h-1 rounded-full bg-violet-400 animate-twinkle" />
        <div className="absolute bottom-12 left-8 w-1 h-1 rounded-full bg-star animate-twinkle"
          style={{ animationDelay: '1.5s' }} />

        <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans mb-3">
          ✦ &nbsp; Quase lá &nbsp; ✦
        </p>

        <h2 className="font-display text-3xl text-star mb-2">Escaneie o QR Code</h2>

        <p className="text-stardust text-sm font-sans mb-6 leading-relaxed">
          Pague com Pix e em instantes o céu de vocês estará guardado para sempre.
          O link chega no seu e-mail. 💜
        </p>

        {/* QR Code */}
        {pixData.qrCodeBase64 ? (
          <div className="flex justify-center mb-5">
            <div className="bg-white p-3 rounded-2xl">
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-44 h-44"
              />
            </div>
          </div>
        ) : (
          <div className="w-44 h-44 mx-auto mb-5 rounded-2xl flex items-center justify-center border border-violet-500/20"
            style={{ background: 'rgba(7,7,26,0.8)' }}>
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Copy-paste code */}
        {pixData.qrCode && (
          <div className="mb-5">
            <p className="text-nebula text-xs font-sans mb-2">Ou copie o código Pix:</p>
            <div className="flex items-center gap-2 rounded-xl p-3 border border-white/5"
              style={{ background: 'rgba(7,7,26,0.8)' }}>
              <code className="text-star text-xs font-mono flex-1 truncate text-left">
                {pixData.qrCode.substring(0, 38)}…
              </code>
              <button
                onClick={copiar}
                className="flex-shrink-0 text-xs font-sans px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: copiado ? 'rgba(124,58,237,0.5)' : 'rgba(124,58,237,0.25)',
                  color: copiado ? '#c4b5fd' : '#a78bfa',
                }}
              >
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(7,7,26,0.5)' }}>
          <p className="text-stardust text-xs font-sans leading-relaxed">
            Após o pagamento, você receberá um e-mail com o link da página de vocês
            e o QR Code para imprimir e emoldurar.
          </p>
        </div>

        <p className="mt-4 text-nebula text-xs font-sans">
          R$ 29,90 · Pix instantâneo · Acesso em segundos
        </p>
      </div>
    </div>
  )
}

// ── CartaoResultadoModal ───────────────────────────────────────────────────────

function CartaoResultadoModal({ resultado, onClose }: { resultado: CartaoResultado; onClose: () => void }) {
  const { status, slug, mensagem } = resultado
  const canClose = status !== 'approved'

  const content = {
    approved: {
      icon: '✨',
      label: '✦   Pagamento confirmado   ✦',
      titulo: 'Seu céu está guardado!',
      corpo: 'O céu daquela noite especial agora é de vocês para sempre. O link chegará no seu e-mail em instantes. 💜',
    },
    in_process: {
      icon: '⏳',
      label: '✦   Em análise   ✦',
      titulo: 'Pagamento em análise',
      corpo: 'Seu pagamento foi recebido e está sendo analisado. Isso pode levar alguns minutos. Você receberá um e-mail assim que for confirmado.',
    },
    pending: {
      icon: '🕐',
      label: '✦   Aguardando   ✦',
      titulo: 'Aguardando confirmação',
      corpo: 'Seu pedido foi registrado e aguarda a confirmação do pagamento. Você receberá um e-mail em breve.',
    },
    rejected: {
      icon: '💳',
      label: '',
      titulo: 'Cartão recusado',
      corpo: mensagem || 'Não conseguimos processar seu cartão. Verifique os dados ou tente outro cartão.',
    },
  }[status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(7,7,26,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-sm bg-space-800 rounded-3xl border border-violet-500/30 p-8 shadow-2xl text-center">

        {canClose && (
          <button onClick={onClose} className="absolute top-4 right-5 text-nebula hover:text-stardust text-2xl leading-none transition-colors" aria-label="Fechar">
            ×
          </button>
        )}

        <div className="absolute top-8 left-10 w-1 h-1 rounded-full bg-gold-400 animate-pulse-glow" />
        <div className="absolute top-12 right-14 w-1 h-1 rounded-full bg-violet-400 animate-twinkle" />

        <div className="text-5xl mb-4">{content.icon}</div>
        {content.label && (
          <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans mb-3">{content.label}</p>
        )}
        <h2 className="font-display text-3xl text-star mb-3">{content.titulo}</h2>
        <p className="text-stardust text-sm font-sans mb-6 leading-relaxed">{content.corpo}</p>

        {status === 'approved' && slug && (
          <Link
            href={`/casal/${slug}`}
            className="block w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold py-4 rounded-2xl transition-all duration-300 shadow-lg"
          >
            Ver nossa página →
          </Link>
        )}
        {status === 'rejected' && (
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold py-4 rounded-2xl transition-all duration-300"
          >
            Tentar novamente
          </button>
        )}
        {(status === 'in_process' || status === 'pending') && (
          <p className="text-nebula text-xs font-sans">Você pode fechar esta janela — o e-mail chegará assim que aprovado.</p>
        )}
      </div>
    </div>
  )
}

// ── CriarPage ──────────────────────────────────────────────────────────────────

export default function CriarPage() {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1)
  const [formState, setFormState] = useState<FormState>({
    nomeCidade: '',
    latitude: null,
    longitude: null,
    data: '',
    hora: '22:00',
    nomeParceiro1: '',
    nomeParceiro2: '',
    mensagem: '',
    musicaUrl: '',
    musicaNome: '',
    musicaArtista: '',
    musicaCapa: '',
    email: '',
  })
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [starMapUrl, setStarMapUrl] = useState<string | null>(null)
  const [faseLua, setFaseLua] = useState<FaseLua | null>(null)
  const [isLoadingMap, setIsLoadingMap] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [cartaoResultado, setCartaoResultado] = useState<CartaoResultado | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Pagamento ──────────────────────────────────────────────────────────────
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'credit_card'>('pix')
  const mpRef = useRef<MpInstance | null>(null)
  const [cartaoNumero, setCartaoNumero] = useState('')
  const [cartaoNome, setCartaoNome] = useState('')
  const [cartaoCpf, setCartaoCpf] = useState('')
  const [cartaoExpiry, setCartaoExpiry] = useState('')
  const [cartaoCvv, setCartaoCvv] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [opcoesParcelamento, setOpcoesParcelamento] = useState<{ installments: number; label: string }[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState('')

  // Moon phase updates whenever date changes
  useEffect(() => {
    if (formState.data) setFaseLua(calcularFaseLua(formState.data))
    else setFaseLua(null)
  }, [formState.data])

  // Star map preview — debounced, fires when coords or date change
  useEffect(() => {
    if (!formState.latitude || !formState.longitude || !formState.data) return

    const t = setTimeout(async () => {
      setIsLoadingMap(true)
      setStarMapUrl(null)
      try {
        const res = await fetch('/api/generate-sky', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: formState.latitude,
            longitude: formState.longitude,
            date: formState.data,
            rightAscension: 5.6,   // Orion belt — beautiful sky for any date
            declination: -1.2,
            zoom: 3,
          }),
        })
        const data = await res.json()
        if (data.imageUrl) setStarMapUrl(data.imageUrl)
      } catch {/* keep placeholder */}
      finally { setIsLoadingMap(false) }
    }, 1200)

    return () => clearTimeout(t)
  }, [formState.latitude, formState.longitude, formState.data])

  // BIN lookup — busca bandeira e parcelas quando cartaoNumero tem 6+ dígitos
  useEffect(() => {
    const digits = cartaoNumero.replace(/\s/g, '')
    if (digits.length < 6 || !mpRef.current) return
    const bin = digits.slice(0, 6)
    const mp = mpRef.current

    mp.getPaymentMethods({ bin })
      .then(d => setPaymentMethodId(d.results[0]?.id ?? ''))
      .catch(() => {})

    mp.getInstallments({ amount: '29.90', bin, paymentTypeId: 'credit_card' })
      .then(d => {
        const costs = d[0]?.payer_costs ?? []
        setOpcoesParcelamento(costs.map(c => ({ installments: c.installments, label: c.recommended_message })))
        setParcelas(1)
      })
      .catch(() => {})
  }, [cartaoNumero])

  // Handlers ──────────────────────────────────────────────────────────────────

  const handleCidadeSelecionada = useCallback(async (nome: string, uf: string, displayName: string) => {
    setFormState(prev => ({ ...prev, nomeCidade: displayName, latitude: null, longitude: null }))
    setErrors(prev => ({ ...prev, nomeCidade: '' }))
    try {
      const res = await fetch(`/api/geocode?city=${encodeURIComponent(nome)}&uf=${encodeURIComponent(uf)}`)
      const data = await res.json()
      if (data.latitude && data.longitude) {
        setFormState(prev => ({ ...prev, latitude: data.latitude, longitude: data.longitude }))
      }
    } catch {/* geocode failed silently */}
  }, [])

  const handleFotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Compress for upload
    try {
      const blob = await compressImage(file)
      setFoto(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
    } catch {
      setFoto(file)
    }
  }, [])

  const handleMusicaSelecionada = useCallback(async (track: MusicaResult) => {
    // Atualiza preview imediatamente com os dados do iTunes
    setFormState(prev => ({
      ...prev,
      musicaUrl: '',
      musicaNome: track.nome,
      musicaArtista: track.artista,
      musicaCapa: track.capaUrl,
    } as FormState))

    // Background: busca URL do Spotify para embed na página do casal
    if (!track.nome) return
    try {
      const q = encodeURIComponent(`${track.nome} ${track.artista}`)
      const res = await fetch(`/api/spotify/search?q=${q}`)
      const data = await res.json()
      const spotifyUrl: string = data.tracks?.[0]?.spotifyUrl ?? ''
      if (spotifyUrl) {
        setFormState(prev => ({ ...prev, musicaUrl: spotifyUrl } as FormState))
      }
    } catch {/* silently ignore — música continua sem URL de embed */}
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = (step: number): boolean => {
    const errs: Record<string, string> = {}
    if (step === 1) {
      if (!formState.nomeCidade) errs.nomeCidade = 'Escolha a cidade do momento especial'
      if (!formState.data)       errs.data       = 'Qual foi o dia mágico de vocês?'
    }
    if (step === 2) {
      if (!formState.nomeParceiro1.trim()) errs.nomeParceiro1 = 'Coloque o nome do primeiro parceiro'
      if (!formState.nomeParceiro2.trim()) errs.nomeParceiro2 = 'E o nome do segundo parceiro?'
    }
    if (step === 3) {
      if (!formState.email.trim())
        errs.email = 'Precisamos do e-mail para enviar o presente'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email))
        errs.email = 'E-mail inválido'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const proximaEtapa = () => { if (validate(etapa)) setEtapa(e => (Math.min(3, e + 1) as 1 | 2 | 3)) }
  const etapaAnterior = () => setEtapa(e => (Math.max(1, e - 1) as 1 | 2 | 3))

  const handleSubmit = async () => {
    if (!validate(3)) return

    if (formState.latitude === null || formState.longitude === null) {
      setSubmitError('Não encontramos as coordenadas da cidade. Volte à primeira etapa e selecione a cidade novamente.')
      return
    }

    // Validação dos campos de cartão
    if (metodoPagamento === 'credit_card') {
      const errs: Record<string, string> = {}
      const numDigits = cartaoNumero.replace(/\s/g, '')
      if (numDigits.length < 13) errs.cartaoNumero = 'Número do cartão incompleto'
      if (!cartaoNome.trim()) errs.cartaoNome = 'Informe o nome impresso no cartão'
      if (cartaoCpf.replace(/\D/g, '').length !== 11) errs.cartaoCpf = 'CPF inválido'
      const [mes, ano] = cartaoExpiry.split('/')
      if (!mes || !ano || mes.length !== 2 || ano.length !== 2) errs.cartaoExpiry = 'Data de vencimento inválida'
      if (cartaoCvv.length < 3) errs.cartaoCvv = 'CVV inválido'
      if (Object.keys(errs).length > 0) { setErrors(prev => ({ ...prev, ...errs })); return }
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Upload photo
      let urlFoto: string | null = null
      if (foto) {
        const fd = new FormData()
        fd.append('foto', foto)
        const res = await fetch('/api/upload-foto', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.url) urlFoto = data.url
      }

      // 2. Ensure star map URL (re-fetch if missing)
      let urlMapa = starMapUrl
      if (!urlMapa) {
        try {
          const res = await fetch('/api/generate-sky', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: formState.latitude,
              longitude: formState.longitude,
              date: formState.data,
              rightAscension: 5.6,
              declination: -1.2,
              zoom: 3,
            }),
          })
          const data = await res.json()
          if (data.imageUrl) urlMapa = data.imageUrl
        } catch {/* proceed without map */}
      }

      // 3. Montar campos comuns do casal
      const casalPayload = {
        nome_parceiro_1: formState.nomeParceiro1.trim(),
        nome_parceiro_2: formState.nomeParceiro2.trim(),
        data_especial: formState.data,
        local: formState.nomeCidade,
        latitude: formState.latitude,
        longitude: formState.longitude,
        email: formState.email.trim(),
        mensagem_personalizada: formState.mensagem || null,
        musica_url: formState.musicaUrl || null,
        url_foto_casal: urlFoto,
        url_imagem_ceu: urlMapa,
      }

      // 4. PIX
      if (metodoPagamento === 'pix') {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...casalPayload, payment_method: 'pix' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar Pix')
        setPixData({ qrCode: data.pix?.qr_code ?? '', qrCodeBase64: data.pix?.qr_code_base64 ?? '', slug: data.slug ?? '' })
        return
      }

      // 5. CARTÃO — tokenizar pelo SDK antes de chamar o backend
      if (!mpRef.current) throw new Error('SDK do Mercado Pago não carregou. Recarregue a página.')
      const [mes, ano] = cartaoExpiry.split('/')
      let cardToken: { id: string }
      try {
        cardToken = await mpRef.current.createCardToken({
          cardNumber: cartaoNumero.replace(/\s/g, ''),
          cardholderName: cartaoNome.trim(),
          cardExpirationMonth: mes,
          cardExpirationYear: `20${ano}`,
          securityCode: cartaoCvv,
          identificationType: 'CPF',
          identificationNumber: cartaoCpf.replace(/\D/g, ''),
        })
      } catch {
        throw new Error('Não foi possível validar o cartão. Verifique os dados e tente novamente.')
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...casalPayload,
          payment_method: 'credit_card',
          token: cardToken.id,
          payment_method_id: paymentMethodId || 'visa',
          installments: parcelas,
        }),
      })
      const data = await res.json()

      const mpStatus = data.status as string
      if (mpStatus === 'approved') {
        setCartaoResultado({ status: 'approved', slug: data.slug ?? '', mensagem: '' })
      } else if (mpStatus === 'in_process' || mpStatus === 'pending') {
        setCartaoResultado({ status: mpStatus, slug: data.slug ?? '', mensagem: '' })
      } else {
        const detalhe = data.status_detail ?? ''
        const msgs: Record<string, string> = {
          cc_rejected_insufficient_amount: 'Saldo insuficiente no cartão.',
          cc_rejected_bad_filled_card_number: 'Número do cartão incorreto.',
          cc_rejected_bad_filled_date: 'Data de vencimento incorreta.',
          cc_rejected_bad_filled_security_code: 'CVV incorreto.',
          cc_rejected_blacklist: 'Cartão bloqueado. Use outro cartão.',
          cc_rejected_call_for_authorize: 'Ligue para o banco para autorizar.',
          cc_rejected_card_disabled: 'Cartão desativado. Contate o banco.',
          cc_rejected_duplicated_payment: 'Pagamento duplicado detectado.',
          cc_rejected_high_risk: 'Pagamento recusado por segurança.',
        }
        setCartaoResultado({
          status: 'rejected',
          slug: '',
          mensagem: msgs[detalhe] ?? 'Cartão recusado. Verifique os dados ou tente outro cartão.',
        })
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Styles ────────────────────────────────────────────────────────────────────

  const inputCls = (field: string) =>
    `w-full bg-space-800 border ${
      errors[field] ? 'border-red-500/50' : 'border-violet-500/25 focus:border-violet-500/60'
    } text-star placeholder-nebula rounded-xl px-4 py-3 font-sans text-sm outline-none transition-colors`

  const ETAPAS = ['O Momento', 'O Casal', 'Finalizar']

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-space-900">

      {/* Mercado Pago SDK */}
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="lazyOnload"
        onLoad={() => {
          const key = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? ''
          if (key && window.MercadoPago) {
            mpRef.current = new window.MercadoPago(key, { locale: 'pt-BR' })
          }
        }}
      />

      {/* Header */}
      <header className="border-b border-violet-500/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-xl text-stardust italic hover:text-star transition-colors">
            Céu Daquele Dia
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse-glow" />
            <span className="text-nebula text-xs font-sans">R$ 29,90 / ano</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center px-6 py-10 md:py-14">
        <p className="text-violet-400 text-xs tracking-[4px] uppercase font-sans mb-4">
          ✦ &nbsp; Criando o presente &nbsp; ✦
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-star leading-tight mb-3">
          O céu que testemunhou<br />
          <span className="text-gradient italic">o amor de vocês</span>
        </h1>
        <p className="text-stardust font-sans text-sm max-w-xs mx-auto leading-relaxed">
          Preencha os detalhes. O preview ao lado se atualiza enquanto você escreve.
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="flex items-center justify-center">
          {ETAPAS.map((label, i) => {
            const step = i + 1
            const active = etapa === step
            const done = etapa > step
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-semibold transition-all duration-300 ${
                    done   ? 'bg-violet-600 text-white' :
                    active ? 'border-2 border-violet-500 text-violet-300 bg-violet-600/20' :
                             'border border-white/10 text-nebula bg-space-800'
                  }`}>
                    {done ? '✓' : step}
                  </div>
                  <span className={`text-[10px] font-sans hidden sm:block transition-colors duration-300 ${
                    active ? 'text-violet-400' : done ? 'text-violet-600' : 'text-nebula'
                  }`}>{label}</span>
                </div>
                {i < 2 && (
                  <div className={`w-14 md:w-24 h-px mx-2 mb-4 transition-all duration-500 ${done ? 'bg-violet-600' : 'bg-white/10'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* ── Form column ── */}
        <div className="min-h-[480px]">

          {/* STEP 1 */}
          <div className={etapa === 1 ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl text-star mb-1">O Momento Especial</h2>
                <p className="text-stardust text-sm font-sans">
                  Onde e quando o amor de vocês ficou guardado nas estrelas?
                </p>
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  Cidade do momento
                </label>
                <CidadeInput onSelect={handleCidadeSelecionada} hasError={!!errors.nomeCidade} />
                {errors.nomeCidade
                  ? <p className="mt-1.5 text-red-400 text-xs font-sans">{errors.nomeCidade}</p>
                  : formState.latitude
                    ? <p className="mt-1.5 text-violet-400/60 text-xs font-sans">✓ Coordenadas encontradas — calculando o céu…</p>
                    : formState.nomeCidade
                      ? <p className="mt-1.5 text-nebula text-xs font-sans">Buscando coordenadas…</p>
                      : null
                }
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  A data especial
                </label>
                <input
                  type="date"
                  value={formState.data}
                  onChange={set('data')}
                  max={new Date().toISOString().split('T')[0]}
                  className={inputCls('data')}
                  style={{ colorScheme: 'dark' }}
                />
                {errors.data
                  ? <p className="mt-1.5 text-red-400 text-xs font-sans">{errors.data}</p>
                  : faseLua
                    ? <p className="mt-1.5 text-xs font-sans" style={{ color: 'rgba(245,215,142,0.7)' }}>
                        ✦ Naquela noite: {faseLua.nome} com {faseLua.iluminacao}% de brilho
                      </p>
                    : null
                }
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  Que horas eram?{' '}
                  <span className="text-nebula normal-case font-normal tracking-normal">(opcional)</span>
                </label>
                <input
                  type="time"
                  value={formState.hora}
                  onChange={set('hora')}
                  className={inputCls('hora')}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <button
                type="button"
                onClick={proximaEtapa}
                className="btn-glow w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg"
              >
                Continuar →
              </button>
            </div>
          </div>

          {/* STEP 2 */}
          <div className={etapa === 2 ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl text-star mb-1">O Casal</h2>
                <p className="text-stardust text-sm font-sans">
                  Quem são os dois que fazem essa história tão bonita?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">Primeiro nome</label>
                  <input
                    type="text"
                    value={formState.nomeParceiro1}
                    onChange={set('nomeParceiro1')}
                    placeholder="Ex: Ana"
                    className={inputCls('nomeParceiro1')}
                  />
                  {errors.nomeParceiro1 && <p className="mt-1 text-red-400 text-xs font-sans">{errors.nomeParceiro1}</p>}
                </div>
                <div>
                  <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">Segundo nome</label>
                  <input
                    type="text"
                    value={formState.nomeParceiro2}
                    onChange={set('nomeParceiro2')}
                    placeholder="Ex: Carlos"
                    className={inputCls('nomeParceiro2')}
                  />
                  {errors.nomeParceiro2 && <p className="mt-1 text-red-400 text-xs font-sans">{errors.nomeParceiro2}</p>}
                </div>
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  Cartinha de vocês{' '}
                  <span className="text-nebula normal-case font-normal tracking-normal">(opcional)</span>
                </label>
                <textarea
                  value={formState.mensagem}
                  onChange={set('mensagem')}
                  placeholder="Aquele parágrafo que vai fazer os olhos marejarem… 💜"
                  rows={4}
                  maxLength={500}
                  className={`${inputCls('mensagem')} resize-none`}
                />
                <p className="mt-1 text-nebula text-xs font-sans text-right">{formState.mensagem.length}/500</p>
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  Uma foto especial de vocês{' '}
                  <span className="text-nebula normal-case font-normal tracking-normal">(opcional)</span>
                </label>

                {fotoPreview ? (
                  <div className="flex items-center gap-5">
                    <div className="bg-white shadow-xl flex-shrink-0"
                      style={{ padding: '6px 6px 22px', transform: 'rotate(-1.5deg)', width: '80px' }}>
                      <img src={fotoPreview} alt="Preview" className="w-full aspect-square object-cover" />
                    </div>
                    <div>
                      <p className="text-star text-sm font-sans mb-2">Foto linda! 💜</p>
                      <label className="cursor-pointer text-violet-400 text-xs font-sans hover:text-violet-300 underline underline-offset-2 transition-colors">
                        Trocar foto
                        <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-violet-500/25 hover:border-violet-500/50 rounded-2xl p-8 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-full bg-space-800 border border-violet-500/20 group-hover:border-violet-500/40 flex items-center justify-center text-2xl transition-colors">
                      📷
                    </div>
                    <div className="text-center">
                      <p className="text-stardust text-sm font-sans">Clique para adicionar uma foto</p>
                      <p className="text-nebula text-xs font-sans mt-1">JPG, PNG, HEIC · Máx. 10 MB</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={etapaAnterior}
                  className="flex-1 border border-violet-500/25 hover:border-violet-500/50 text-stardust hover:text-star font-sans text-sm px-5 py-4 rounded-2xl transition-all duration-300"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={proximaEtapa}
                  className="btn-glow flex-[2] bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg"
                >
                  Continuar →
                </button>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className={etapa === 3 ? 'block' : 'hidden'}>
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl text-star mb-1">O Toque Final</h2>
                <p className="text-stardust text-sm font-sans">
                  Quase lá! Só mais um detalhe para eternizar esse momento.
                </p>
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  A música de vocês{' '}
                  <span className="text-nebula normal-case font-normal tracking-normal">(opcional)</span>
                </label>
                <MusicaInput onSelect={handleMusicaSelecionada} />
                <p className="mt-1.5 text-nebula text-xs font-sans">
                  Busque por nome da música ou nome do artista no Spotify.
                </p>
              </div>

              <div>
                <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
                  Seu e-mail para receber o presente
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={set('email')}
                  placeholder="seu@email.com"
                  className={inputCls('email')}
                />
                {errors.email && <p className="mt-1.5 text-red-400 text-xs font-sans">{errors.email}</p>}
                <p className="mt-1.5 text-nebula text-xs font-sans">
                  Você recebe o link da página e o QR Code para imprimir. 📩
                </p>
              </div>

              {/* Order summary */}
              <div className="rounded-2xl p-5 border border-violet-500/15 space-y-2"
                style={{ background: 'rgba(13,13,40,0.6)' }}>
                <p className="text-stardust text-xs font-sans uppercase tracking-wider mb-3">Resumo</p>
                <div className="flex justify-between">
                  <span className="text-nebula text-sm font-sans">
                    {formState.nomeParceiro1 || 'Nome 1'} &amp; {formState.nomeParceiro2 || 'Nome 2'}
                  </span>
                  <span className="text-star text-sm font-sans">
                    {formState.data ? formatarDataBR(formState.data) : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-nebula text-sm font-sans">{formState.nomeCidade || '—'}</span>
                  {faseLua && (
                    <span className="text-sm font-sans" style={{ color: '#f5d78e' }}>{faseLua.nome}</span>
                  )}
                </div>
                <div className="border-t border-white/5 mt-3 pt-3 flex justify-between items-baseline">
                  <span className="text-stardust font-sans font-semibold text-sm">Total</span>
                  <span className="font-display text-xl text-star">R$ 29,90</span>
                </div>
                <p className="text-nebula text-xs font-sans text-center">Acesso por 12 meses · Renovável</p>
              </div>

              {/* Método de pagamento */}
              <div>
                <p className="text-stardust text-xs font-sans uppercase tracking-wider mb-3">Forma de pagamento</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['pix', 'credit_card'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMetodoPagamento(m); setSubmitError(null) }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                        metodoPagamento === m
                          ? 'border-violet-500/60 bg-violet-500/10'
                          : 'border-violet-500/20 hover:border-violet-500/40'
                      }`}
                    >
                      <span className="text-2xl">{m === 'pix' ? '⚡' : '💳'}</span>
                      <span className="text-star text-sm font-sans font-medium">
                        {m === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                      </span>
                      {m === 'pix' && (
                        <span className="text-[10px] font-sans text-nebula">Aprovação instantânea</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formulário de cartão */}
              {metodoPagamento === 'credit_card' && (
                <div className="space-y-4 rounded-2xl border border-violet-500/20 p-5"
                  style={{ background: 'rgba(13,13,40,0.5)' }}>
                  <p className="text-stardust text-xs font-sans uppercase tracking-wider">Dados do cartão</p>

                  {/* Número */}
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cartaoNumero}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 16)
                        setCartaoNumero(v.replace(/(.{4})/g, '$1 ').trim())
                        setErrors(p => ({ ...p, cartaoNumero: '' }))
                      }}
                      className={inputCls('cartaoNumero')}
                    />
                    {errors.cartaoNumero && <p className="mt-1 text-red-400 text-xs font-sans">{errors.cartaoNumero}</p>}
                  </div>

                  {/* Nome */}
                  <div>
                    <input
                      type="text"
                      placeholder="Nome conforme impresso no cartão"
                      value={cartaoNome}
                      onChange={e => { setCartaoNome(e.target.value.toUpperCase()); setErrors(p => ({ ...p, cartaoNome: '' })) }}
                      className={inputCls('cartaoNome')}
                    />
                    {errors.cartaoNome && <p className="mt-1 text-red-400 text-xs font-sans">{errors.cartaoNome}</p>}
                  </div>

                  {/* CPF */}
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="CPF do titular"
                      maxLength={14}
                      value={cartaoCpf}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 11)
                        setCartaoCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_,a,b,c,d) => d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a))
                        setErrors(p => ({ ...p, cartaoCpf: '' }))
                      }}
                      className={inputCls('cartaoCpf')}
                    />
                    {errors.cartaoCpf && <p className="mt-1 text-red-400 text-xs font-sans">{errors.cartaoCpf}</p>}
                  </div>

                  {/* Vencimento + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cartaoExpiry}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setCartaoExpiry(v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v)
                          setErrors(p => ({ ...p, cartaoExpiry: '' }))
                        }}
                        className={inputCls('cartaoExpiry')}
                      />
                      {errors.cartaoExpiry && <p className="mt-1 text-red-400 text-xs font-sans">{errors.cartaoExpiry}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="CVV"
                        maxLength={4}
                        value={cartaoCvv}
                        onChange={e => { setCartaoCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrors(p => ({ ...p, cartaoCvv: '' })) }}
                        className={inputCls('cartaoCvv')}
                      />
                      {errors.cartaoCvv && <p className="mt-1 text-red-400 text-xs font-sans">{errors.cartaoCvv}</p>}
                    </div>
                  </div>

                  {/* Parcelas */}
                  {opcoesParcelamento.length > 0 && (
                    <select
                      value={parcelas}
                      onChange={e => setParcelas(Number(e.target.value))}
                      className="w-full bg-space-800 border border-violet-500/25 focus:border-violet-500/60 text-star rounded-xl px-4 py-3 font-sans text-sm outline-none transition-colors"
                    >
                      {opcoesParcelamento.map(o => (
                        <option key={o.installments} value={o.installments}>{o.label}</option>
                      ))}
                    </select>
                  )}

                  <p className="text-nebula text-[10px] font-sans flex items-center gap-1">
                    🔒 Seus dados são tokenizados pelo Mercado Pago. Não armazenamos números de cartão.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="rounded-xl p-4 border border-red-500/25"
                  style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <p className="text-red-400 text-sm font-sans">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={etapaAnterior}
                  disabled={isSubmitting}
                  className="flex-1 border border-violet-500/25 hover:border-violet-500/50 text-stardust hover:text-star font-sans text-sm px-5 py-4 rounded-2xl transition-all duration-300 disabled:opacity-50"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-glow flex-[2] bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:from-violet-900 disabled:to-violet-800 text-white font-sans font-semibold text-base px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Preparando o céu de vocês…
                    </>
                  ) : metodoPagamento === 'pix' ? '⚡ Gerar QR Code Pix' : '💳 Pagar com Cartão'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview column (desktop) ── */}
        <div className="hidden lg:block">
          <LivePreview
            formState={formState}
            fotoPreview={fotoPreview}
            starMapUrl={starMapUrl}
            faseLua={faseLua}
            isLoadingMap={isLoadingMap}
          />
        </div>
      </div>

      {/* Preview column (mobile — below form) */}
      <div className="lg:hidden px-6 pb-16">
        <div className="border-t border-violet-500/10 pt-8">
          <p className="text-center text-violet-400 text-xs tracking-[3px] uppercase font-sans mb-6">
            ✦ Preview ✦
          </p>
          <LivePreview
            formState={formState}
            fotoPreview={fotoPreview}
            starMapUrl={starMapUrl}
            faseLua={faseLua}
            isLoadingMap={isLoadingMap}
          />
        </div>
      </div>

      {/* Pix modal */}
      {pixData && <PixModal pixData={pixData} onClose={() => setPixData(null)} />}

      {/* Cartão resultado modal */}
      {cartaoResultado && (
        <CartaoResultadoModal
          resultado={cartaoResultado}
          onClose={() => setCartaoResultado(null)}
        />
      )}
    </main>
  )
}
