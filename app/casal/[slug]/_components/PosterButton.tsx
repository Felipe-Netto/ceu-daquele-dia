'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toPng } from 'html-to-image'
import QRCode from 'qrcode'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Opcoes {
  foto:      boolean
  nomes:     boolean
  data:      boolean
  desde:     boolean
  local:     boolean
  coords:    boolean
  qrcode:    boolean
  mensagem:  boolean
}

export interface PosterButtonProps {
  nome1:        string
  nome2:        string
  dataFormatada: string
  ano:          string
  localStr:     string
  latitude:     number
  longitude:    number
  urlImagem:    string | null
  urlFoto:      string | null
  slug:         string
  mensagem:     string | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif'
const SANS  = '"Lato", system-ui, -apple-system, sans-serif'
const W = 600
const H = 800

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDMS(deg: number, isLat: boolean): string {
  const abs = Math.abs(deg)
  const d   = Math.floor(abs)
  const m   = Math.floor((abs - d) * 60)
  const s   = ((abs - d - m / 60) * 3600).toFixed(1)
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'L' : 'O')
  return `${d}°${m}'${s}" ${dir}`
}

// ── PosterContent ─────────────────────────────────────────────────────────────

function PosterContent({
  opcoes,
  nome1, nome2, dataFormatada, ano, localStr, latitude, longitude,
  urlImagem, urlFoto, qrDataUrl, mensagem, posterRef,
}: {
  opcoes:        Opcoes
  nome1:         string
  nome2:         string
  dataFormatada: string
  ano:           string
  localStr:      string
  latitude:      number
  longitude:     number
  urlImagem:     string | null
  urlFoto:       string | null
  qrDataUrl:     string | null
  mensagem:      string | null
  posterRef?:    React.RefObject<HTMLDivElement | null>
}) {
  const showFoto   = opcoes.foto && !!urlFoto
  const mapSize    = showFoto ? 224 : 278
  const hasSubInfo = opcoes.data || opcoes.local || opcoes.coords || opcoes.desde

  // Two clean info lines — time-related (line 1) · place-related (line 2)
  const infoLine1 = [
    opcoes.desde && `Juntos desde ${ano}`,
    opcoes.data  && dataFormatada,
  ].filter(Boolean).join('  ·  ')

  const infoLine2 = [
    opcoes.local  && localStr,
    opcoes.coords && `${toDMS(latitude, true)}  ·  ${toDMS(longitude, false)}`,
  ].filter(Boolean).join('  ·  ')

  return (
    <div
      ref={posterRef}
      style={{
        width: W, height: H,
        background: '#060e1c',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '36px 44px 30px',
        boxSizing: 'border-box',
        fontFamily: SERIF,
      }}
    >
      {/* Top ornament */}
      <p style={{
        fontFamily: SANS, color: 'rgba(167,139,250,0.22)',
        fontSize: 11, letterSpacing: 12, margin: '0 0 12px',
      }}>
        ✦ · · · ✦
      </p>

      {/* Caption — contextualises the star map */}
      <p style={{
        fontFamily: SANS, fontStyle: 'italic',
        fontSize: 11, color: 'rgba(200,185,255,0.46)',
        margin: '0 0 16px', letterSpacing: 0.4, lineHeight: 1.4,
        textAlign: 'center',
      }}>
        O céu de {localStr} em {dataFormatada}
      </p>

      {/* ── Star map — main protagonist ── */}
      <div style={{ position: 'relative', marginBottom: showFoto ? 14 : 22, flexShrink: 0 }}>
        {/* Golden-violet glow */}
        <div style={{
          position: 'absolute', inset: -24,
          background: 'radial-gradient(ellipse at center, rgba(245,215,142,0.14) 0%, rgba(124,58,237,0.11) 52%, transparent 72%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        {/* Subtle outer golden ring */}
        <div style={{
          position: 'absolute', inset: -5, borderRadius: '50%',
          border: '1px solid rgba(245,215,142,0.15)',
          pointerEvents: 'none', zIndex: 2,
        }} />
        {/* Main circle */}
        <div style={{
          width: mapSize, height: mapSize, borderRadius: '50%',
          overflow: 'hidden',
          border: '1.5px solid rgba(245,215,142,0.52)',
          position: 'relative', zIndex: 1,
          boxShadow: '0 0 32px rgba(245,215,142,0.1), 0 8px 36px rgba(0,0,0,0.5)',
        }}>
          {urlImagem ? (
            <img
              src={urlImagem}
              alt=""
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                filter: 'brightness(1.32) contrast(1.5) saturate(1.7)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'radial-gradient(ellipse at 50% 45%, #0c1e3a 0%, #070e1f 60%, #04090f 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'rgba(245,215,142,0.2)', fontSize: 40 }}>✦</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Polaroid photo — harmonious below map ── */}
      {showFoto && (
        <div style={{ marginBottom: 18, flexShrink: 0 }}>
          <div style={{
            background: '#ffffff',
            padding: '6px 6px 20px',
            transform: 'rotate(-2.5deg)',
            boxShadow: '0 10px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <img
              src={urlFoto!}
              alt=""
              style={{ width: 96, height: 96, objectFit: 'cover', display: 'block' }}
            />
            <p style={{
              fontFamily: '"Georgia", serif',
              fontSize: 7.5, color: '#444', textAlign: 'center',
              margin: '4px 0 0', letterSpacing: 0.8,
            }}>
              {nome1} &amp; {nome2}
            </p>
          </div>
        </div>
      )}

      {/* ── Names — main title ── */}
      {opcoes.nomes && (
        <p style={{
          fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300,
          fontSize: showFoto ? 36 : 46, color: '#f0e6ff', lineHeight: 1.1,
          margin: '0 0 16px', textAlign: 'center',
        }}>
          {nome1} &amp; {nome2}
        </p>
      )}

      {/* ── Divider — separates title area from info block ── */}
      {hasSubInfo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', marginBottom: 14,
        }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.14))' }} />
          <span style={{ fontFamily: SANS, color: 'rgba(167,139,250,0.3)', fontSize: 9 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(167,139,250,0.14))' }} />
        </div>
      )}

      {/* ── Info block — max 2 clean horizontal lines, uppercase ── */}
      {hasSubInfo && (
        <div style={{ textAlign: 'center', width: '100%' }}>
          {/* Line 1: desde + data */}
          {infoLine1 && (
            <p style={{
              fontFamily: SANS, fontWeight: 300,
              fontSize: 9.5, color: 'rgba(155,140,192,0.75)',
              letterSpacing: 3, textTransform: 'uppercase',
              margin: infoLine2 ? '0 0 6px' : '0',
            }}>
              {infoLine1}
            </p>
          )}
          {/* Line 2: local + coords */}
          {infoLine2 && (
            <p style={{
              fontFamily: SANS, fontWeight: 300,
              fontSize: 9, color: 'rgba(107,94,138,0.65)',
              letterSpacing: 2.5, textTransform: 'uppercase',
              margin: 0,
            }}>
              {infoLine2}
            </p>
          )}
        </div>
      )}

      {/* ── Mensagem personalizada ── */}
      {opcoes.mensagem && mensagem && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', margin: hasSubInfo ? '14px 0 12px' : '0 0 12px',
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.1))' }} />
            <span style={{ fontFamily: SANS, color: 'rgba(167,139,250,0.22)', fontSize: 8 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(167,139,250,0.1))' }} />
          </div>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300,
            fontSize: 12.5, color: 'rgba(200,185,255,0.58)',
            lineHeight: 1.7, textAlign: 'center',
            maxWidth: '86%', margin: '0 auto',
            wordBreak: 'break-word', overflowWrap: 'break-word',
          }}>
            &ldquo;{mensagem}&rdquo;
          </p>
        </>
      )}

      {/* Spacer pushes footer to the very bottom */}
      <div style={{ flex: 1, minHeight: 8 }} />

      {/* ── Footer bar: branding left · QR right ── */}
      <div style={{
        width: '100%', paddingTop: 12, flexShrink: 0,
        borderTop: '1px solid rgba(167,139,250,0.07)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        {/* Left: site signature */}
        <div>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: 13, color: 'rgba(240,230,255,0.25)',
            margin: 0, lineHeight: 1.2,
          }}>
            Céu Daquele Dia
          </p>
          <p style={{
            fontFamily: SANS, fontSize: 7.5, fontWeight: 300,
            color: 'rgba(107,94,138,0.3)', margin: '2px 0 0',
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            ceudaquelaedia.com.br
          </p>
        </div>

        {/* Right: QR code — discreet, fixed corner */}
        {opcoes.qrcode && qrDataUrl && (
          <div style={{ width: 42, height: 42, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
            <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── PosterButton ──────────────────────────────────────────────────────────────

export default function PosterButton({
  nome1, nome2, dataFormatada, ano, localStr, latitude, longitude, urlImagem, urlFoto, slug, mensagem,
}: PosterButtonProps) {
  const [open, setOpen]                   = useState(false)
  const [mounted, setMounted]             = useState(false)
  const [previewScale, setPreviewScale]   = useState(0.55)
  const previewWrapRef                    = useRef<HTMLDivElement>(null)
  const [opcoes, setOpcoes]               = useState<Opcoes>({
    foto: !!urlFoto, nomes: true, data: true, desde: true,
    local: true, coords: true, qrcode: true, mensagem: !!mensagem,
  })
  const [qrDataUrl, setQrDataUrl]         = useState<string | null>(null)
  const [imageDataUrl, setImageDataUrl]   = useState<string | null>(null)
  const [fotoDataUrl, setFotoDataUrl]     = useState<string | null>(null)
  const [downloading, setDownloading]     = useState(false)
  const posterRef                         = useRef<HTMLDivElement>(null)

  // Generate QR code when modal opens
  useEffect(() => {
    if (!open) return
    const pageUrl = `${window.location.origin}/casal/${slug}`
    QRCode.toDataURL(pageUrl, {
      width: 200, margin: 1,
      color: { dark: '#f0e6ff', light: '#060e1c' },
    })
      .then(setQrDataUrl)
      .catch(() => {})
  }, [open, slug])

  // Proxy images to avoid CORS issues during canvas capture
  useEffect(() => {
    if (!open || !urlImagem) return
    fetch(`/api/proxy-image?url=${encodeURIComponent(urlImagem)}`)
      .then(r => r.ok ? r.blob() : null)
      .then(blob => {
        if (!blob) return
        const reader = new FileReader()
        reader.onload = () => setImageDataUrl(reader.result as string)
        reader.readAsDataURL(blob)
      })
      .catch(() => {})
  }, [open, urlImagem])

  useEffect(() => {
    if (!open || !urlFoto) return
    fetch(`/api/proxy-image?url=${encodeURIComponent(urlFoto)}`)
      .then(r => r.ok ? r.blob() : null)
      .then(blob => {
        if (!blob) return
        const reader = new FileReader()
        reader.onload = () => setFotoDataUrl(reader.result as string)
        reader.readAsDataURL(blob)
      })
      .catch(() => {})
  }, [open, urlFoto])

  const toggle = useCallback((key: keyof Opcoes) => {
    setOpcoes(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return
    setDownloading(true)
    try {
      await document.fonts.ready
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        fetchRequestInit: { cache: 'no-cache' },
      })
      const a = document.createElement('a')
      a.download = `quadro-${slug}.png`
      a.href = dataUrl
      a.click()
    } catch (err) {
      console.error('Erro ao gerar pôster:', err)
    } finally {
      setDownloading(false)
    }
  }, [slug])

  // Mark as mounted (needed for portal)
  useEffect(() => { setMounted(true) }, [])

  // Calcula o scale ideal com base no espaço disponível no painel de prévia
  useEffect(() => {
    if (!open) return
    const calc = () => {
      if (!previewWrapRef.current) return
      const available = previewWrapRef.current.clientWidth - 56 // desconta padding interno
      setPreviewScale(Math.min(0.68, Math.max(0.3, available / W)))
    }
    const t = setTimeout(calc, 30) // aguarda o layout renderizar
    window.addEventListener('resize', calc)
    return () => { clearTimeout(t); window.removeEventListener('resize', calc) }
  }, [open])

  // Keyboard close + scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const OPTIONS: { key: keyof Opcoes; label: string }[] = [
    ...(urlFoto    ? [{ key: 'foto'     as const, label: 'Foto do casal (polaroid)'   }] : []),
    { key: 'nomes',    label: 'Nomes do casal'           },
    { key: 'data',     label: 'Data por extenso'          },
    { key: 'desde',    label: `Desde ${ano}`              },
    { key: 'local',    label: 'Local'                     },
    { key: 'coords',   label: 'Coordenadas geográficas'   },
    ...(mensagem   ? [{ key: 'mensagem' as const, label: 'Mensagem personalizada'     }] : []),
    { key: 'qrcode',   label: 'QR Code da página'         },
  ]

  const sharedPosterProps = {
    opcoes, nome1, nome2, dataFormatada, ano, localStr, latitude, longitude, qrDataUrl,
    urlFoto, mensagem,
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2.5 font-sans font-medium text-sm px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(8,8,24,0.82)',
          border: '1px solid rgba(124,58,237,0.42)',
          color: '#c4b5fd',
          boxShadow: '0 0 26px rgba(124,58,237,0.22), 0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(167,139,250,0.07)',
        }}
      >
        🖼️ Baixar Versão para Quadro
      </button>

      {/* ── Modal (via portal — escapa de qualquer transform/stacking context do pai) ── */}
      {mounted && open && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(4,4,15,0.94)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              width: '100%', maxWidth: '64rem',
              maxHeight: '90vh',
              background: '#0a0a1e',
              border: '1px solid rgba(124,58,237,0.18)',
              borderRadius: '1.5rem',
              boxShadow: '0 40px 120px rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              margin: 'auto',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 28px', flexShrink: 0,
              borderBottom: '1px solid rgba(124,58,237,0.1)',
            }}>
              <div>
                <h2 className="font-display italic text-2xl" style={{ color: '#f0e6ff' }}>
                  Versão para Quadro
                </h2>
                <p className="font-sans text-xs mt-0.5" style={{ color: '#6b5e8a' }}>
                  Personalize o pôster e baixe em alta resolução
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center font-sans text-base transition-all hover:bg-white/5"
                style={{ color: '#6b5e8a', flexShrink: 0 }}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row" style={{ overflowY: 'auto', flex: 1 }}>

              {/* Options panel */}
              <div
                className="w-full lg:w-72 flex-shrink-0 p-7 space-y-2 border-b border-violet-500/10 lg:border-b-0 lg:border-r lg:border-r-violet-500/10"
              >
                <p className="font-sans text-xs uppercase tracking-widest pb-3" style={{ color: '#3a3060' }}>
                  Elementos do pôster
                </p>

                {OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer select-none py-1.5">
                    <input
                      type="checkbox"
                      checked={opcoes[key]}
                      onChange={() => toggle(key)}
                      className="sr-only"
                    />
                    {/* Toggle track */}
                    <div
                      aria-hidden
                      style={{
                        width: 40, height: 22, borderRadius: 99, flexShrink: 0,
                        background: opcoes[key] ? '#7c3aed' : 'rgba(74,64,112,0.22)',
                        border: opcoes[key] ? 'none' : '1px solid rgba(107,94,138,0.28)',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: 3, width: 16, height: 16,
                        borderRadius: '50%', background: '#f0e6ff',
                        left: opcoes[key] ? 21 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </div>
                    <span
                      className="font-sans text-sm transition-colors duration-200"
                      style={{ color: opcoes[key] ? '#c4b5fd' : '#6b5e8a' }}
                    >
                      {label}
                    </span>
                  </label>
                ))}

                {/* Download button */}
                <div className="pt-5">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-2.5 font-sans font-semibold text-sm py-4 rounded-2xl transition-all duration-300"
                    style={{
                      background: downloading
                        ? 'rgba(124,58,237,0.28)'
                        : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      color: '#f0e6ff',
                      boxShadow: downloading ? 'none' : '0 0 28px rgba(124,58,237,0.38)',
                      cursor: downloading ? 'wait' : 'pointer',
                    }}
                  >
                    {downloading ? (
                      <>
                        <div
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'rgba(196,181,253,0.2)', borderTopColor: '#c4b5fd' }}
                        />
                        Gerando PNG…
                      </>
                    ) : (
                      <>⬇ Gerar e Baixar (PNG)</>
                    )}
                  </button>
                  <p className="font-sans text-xs text-center mt-3" style={{ color: '#3a3060' }}>
                    Resolução 2× · Pronto para impressão
                  </p>
                </div>
              </div>

              {/* Preview panel */}
              <div
                ref={previewWrapRef}
                className="flex-1 flex flex-col items-center justify-start p-7 lg:p-10"
              >
                <p className="font-sans text-xs uppercase tracking-widest mb-5" style={{ color: '#3a3060' }}>
                  Prévia do pôster
                </p>
                <div
                  style={{
                    width: W * previewScale,
                    height: H * previewScale,
                    overflow: 'hidden',
                    borderRadius: 10,
                    flexShrink: 0,
                    boxShadow: '0 16px 56px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.12)',
                  }}
                >
                  <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: W, height: H }}>
                    <PosterContent {...sharedPosterProps} urlImagem={urlImagem} urlFoto={urlFoto} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Capture target: só existe enquanto o modal está aberto, portaled ao body ── */}
      {mounted && open && createPortal(
        <div
          style={{ position: 'fixed', top: 0, left: '-99999px', pointerEvents: 'none', zIndex: -1 }}
          aria-hidden
        >
          <PosterContent
            {...sharedPosterProps}
            urlImagem={imageDataUrl ?? urlImagem}
            urlFoto={fotoDataUrl ?? urlFoto}
            posterRef={posterRef}
          />
        </div>,
        document.body
      )}
    </>
  )
}
