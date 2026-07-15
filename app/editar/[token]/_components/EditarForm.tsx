'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { Casal } from '@/app/lib/supabase'
import { compressImage } from '@/app/lib/compress-image'

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastState = { type: 'success' | 'error'; message: string } | null

interface FormState {
  nome_parceiro_1: string
  nome_parceiro_2: string
  data_especial: string
  local: string
  mensagem_personalizada: string
  musica_url: string
  slug_pagina_exclusiva: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Only keep a-z0-9 and hyphens, lowercase, no diacritics
function toSlug(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

// Parse "Florianópolis — SC" → { city: "Florianópolis", uf: "SC" }
function parseLocal(local: string) {
  const parts = local.split(' — ')
  return { city: parts[0]?.trim() ?? local, uf: parts[1]?.trim() ?? '' }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EditarForm({ casal }: { casal: Casal }) {
  const [form, setForm] = useState<FormState>({
    nome_parceiro_1:      casal.nome_parceiro_1,
    nome_parceiro_2:      casal.nome_parceiro_2,
    data_especial:        casal.data_especial.split('T')[0],
    local:                casal.local,
    mensagem_personalizada: casal.mensagem_personalizada ?? '',
    musica_url:           casal.musica_url ?? '',
    slug_pagina_exclusiva: casal.slug_pagina_exclusiva,
  })

  // Star map — can be refreshed without saving
  const [urlImagem, setUrlImagem] = useState(casal.url_imagem_ceu)

  // Photo manager
  const [novaFoto, setNovaFoto]     = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(casal.url_foto_casal)
  const [fotoRemovida, setFotoRemovida] = useState(false)

  // UI
  const [currentSlug, setCurrentSlug] = useState(casal.slug_pagina_exclusiva)
  const [saving, setSaving]           = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [toast, setToast]             = useState<ToastState>(null)
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const toastTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const expirado = new Date(casal.data_expiracao) < new Date()

  const [preco, setPreco] = useState(29.90)
  const precoFormatado = `R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  useEffect(() => {
    fetch('/api/preco')
      .then(r => r.json())
      .then(d => { if (typeof d.preco === 'number' && d.preco > 0) setPreco(d.preco) })
      .catch(() => {})
  }, [])

  // ── Toast ─────────────────────────────────────────────────────────────────

  const showToast = useCallback((t: NonNullable<ToastState>) => {
    setToast(t)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4500)
  }, [])

  // ── Form field setter ──────────────────────────────────────────────────────

  const setField = useCallback(<K extends keyof FormState>(key: K, value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }, [])

  // ── Photo handlers ─────────────────────────────────────────────────────────

  const handleFotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoRemovida(false)

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Compress for upload
    try {
      const blob = await compressImage(file)
      setNovaFoto(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
    } catch {
      setNovaFoto(file)
    }
  }, [])

  const removerFoto = useCallback(() => {
    setFotoPreview(null)
    setNovaFoto(null)
    setFotoRemovida(true)
  }, [])

  // ── Regenerar mapa ─────────────────────────────────────────────────────────

  const handleRegenerarMapa = useCallback(async () => {
    setRegenerating(true)
    try {
      // Try to get updated coords from the local field
      let lat = casal.latitude
      let lon = casal.longitude
      const { city, uf } = parseLocal(form.local)

      if (city) {
        try {
          const geo = await fetch(
            `/api/geocode?city=${encodeURIComponent(city)}&uf=${encodeURIComponent(uf)}`
          )
          const geoData = await geo.json()
          if (geoData.latitude && geoData.longitude) {
            lat = geoData.latitude
            lon = geoData.longitude
          }
        } catch {
          /* keep existing coords */
        }
      }

      const res = await fetch('/api/generate-sky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude:       lat,
          longitude:      lon,
          date:           form.data_especial,
          rightAscension: 5.6,
          declination:    -1.2,
          zoom:           3,
        }),
      })
      const data = await res.json()

      if (data.imageUrl) {
        setUrlImagem(data.imageUrl)
        showToast({ type: 'success', message: 'Mapa estelar atualizado! Clique em Salvar para confirmar.' })
      } else {
        throw new Error('no url')
      }
    } catch {
      showToast({ type: 'error', message: 'Não foi possível regenerar o mapa. Tente novamente.' })
    } finally {
      setRegenerating(false)
    }
  }, [casal.latitude, casal.longitude, form.local, form.data_especial, showToast])

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}

    if (!form.nome_parceiro_1.trim()) errs.nome_parceiro_1 = 'Informe o nome do primeiro parceiro'
    if (!form.nome_parceiro_2.trim()) errs.nome_parceiro_2 = 'Informe o nome do segundo parceiro'
    if (!form.data_especial)          errs.data_especial   = 'Informe a data especial'
    if (!form.local.trim())           errs.local           = 'Informe o local'

    const slug = form.slug_pagina_exclusiva
    if (!slug) {
      errs.slug_pagina_exclusiva = 'O endereço da página é obrigatório'
    } else if (slug.length < 3) {
      errs.slug_pagina_exclusiva = 'O endereço deve ter pelo menos 3 caracteres'
    } else if (!SLUG_RE.test(slug)) {
      errs.slug_pagina_exclusiva = 'Use letras minúsculas, números e hifens. Não comece nem termine com hífen.'
    }

    if (form.musica_url && !/spotify\.com\//.test(form.musica_url)) {
      errs.musica_url = 'Cole um link válido do Spotify (open.spotify.com/track/…)'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form])

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validate()) return
    setSaving(true)

    try {
      // 1. Upload new photo if selected
      let urlFotoFinal: string | null | undefined = undefined
      if (novaFoto) {
        const fd = new FormData()
        fd.append('foto', novaFoto)
        const res = await fetch('/api/upload-foto', { method: 'POST', body: fd })
        const data = await res.json()
        urlFotoFinal = data.url ?? casal.url_foto_casal
      } else if (fotoRemovida) {
        urlFotoFinal = null
      }

      // 2. Build PATCH body
      const body: Record<string, unknown> = {
        token:                  casal.token_edicao,
        nome_parceiro_1:        form.nome_parceiro_1.trim(),
        nome_parceiro_2:        form.nome_parceiro_2.trim(),
        data_especial:          form.data_especial,
        local:                  form.local.trim(),
        mensagem_personalizada: form.mensagem_personalizada.trim() || null,
        musica_url:             form.musica_url.trim() || null,
        slug_pagina_exclusiva:  form.slug_pagina_exclusiva,
        url_imagem_ceu:         urlImagem,
      }
      if (urlFotoFinal !== undefined) body.url_foto_casal = urlFotoFinal

      // 3. Save
      const res  = await fetch('/api/editar', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.field) setErrors(e => ({ ...e, [data.field]: data.error }))
        showToast({ type: 'error', message: data.error ?? 'Erro ao salvar. Tente novamente.' })
        return
      }

      // 4. Success
      const novoSlug = data.slug ?? form.slug_pagina_exclusiva
      setCurrentSlug(novoSlug)
      setNovaFoto(null)
      showToast({ type: 'success', message: 'Alterações salvas com sucesso! 💜' })
    } catch {
      showToast({ type: 'error', message: 'Erro de conexão. Verifique sua internet e tente novamente.' })
    } finally {
      setSaving(false)
    }
  }, [validate, novaFoto, fotoRemovida, casal, form, urlImagem, showToast])

  // ── Styles helper ─────────────────────────────────────────────────────────

  const inputCls = (field: string) =>
    `w-full bg-space-800 border ${
      errors[field]
        ? 'border-red-500/50 focus:border-red-400'
        : 'border-violet-500/25 focus:border-violet-500/60'
    } text-star placeholder-nebula rounded-xl px-4 py-3.5 font-sans text-sm outline-none transition-colors`

  // Spotify track ID for embed preview
  const spotifyTrackId = form.musica_url.match(/track\/([A-Za-z0-9]+)/)?.[1] ?? null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-space-900">
      {/* Top nebula glow */}
      <div
        className="fixed top-0 left-0 right-0 h-96 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.13) 0%, transparent 65%)',
        }}
      />

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 border-b border-white/5 backdrop-blur-sm"
        style={{ background: 'rgba(7,7,26,0.88)' }}
      >
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-lg text-stardust italic hover:text-star transition-colors flex-shrink-0"
          >
            Céu Daquele Dia
          </Link>

          <Link
            href={`/casal/${currentSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-full border border-violet-500/30 hover:border-violet-500/60 text-violet-300 hover:text-violet-200 transition-all duration-200 flex-shrink-0"
          >
            <span>✨</span> Ver Página Pública
          </Link>
        </div>
      </header>

      {/* ── Page Title ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 pt-10 pb-6">
        <p className="text-violet-400 text-[10px] tracking-[5px] uppercase font-sans mb-3">
          ✦ &nbsp; Personalize &nbsp; ✦
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-star leading-tight mb-2">
          Editar sua página
        </h1>
        <p className="text-stardust text-sm font-sans">
          O céu de vocês, do jeito que imaginaram.
        </p>
      </div>

      {/* ── Expirado banner ────────────────────────────────────────────────── */}
      {expirado && (
        <div className="relative z-10 max-w-2xl mx-auto px-5 mb-2">
          <div
            className="rounded-xl px-5 py-4 border border-amber-500/30 flex items-start gap-3"
            style={{ background: 'rgba(120,60,0,0.25)' }}
          >
            <span className="text-amber-400 text-lg flex-shrink-0 mt-0.5">⚠</span>
            <div>
              <p className="text-amber-300 text-sm font-sans font-medium">Assinatura expirada</p>
              <p className="text-amber-400/70 text-xs font-sans mt-0.5">
                A página pública está bloqueada para visitantes. Renove por {precoFormatado} para reativá-la.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 pb-28 space-y-6">

        {/* ── 1. O Casal ───────────────────────────────────────────────────── */}
        <FormSection number="1" title="O Casal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Primeiro nome" error={errors.nome_parceiro_1}>
              <input
                type="text"
                value={form.nome_parceiro_1}
                onChange={e => setField('nome_parceiro_1', e.target.value)}
                placeholder="Ex: Ana"
                className={inputCls('nome_parceiro_1')}
              />
            </FormField>
            <FormField label="Segundo nome" error={errors.nome_parceiro_2}>
              <input
                type="text"
                value={form.nome_parceiro_2}
                onChange={e => setField('nome_parceiro_2', e.target.value)}
                placeholder="Ex: Carlos"
                className={inputCls('nome_parceiro_2')}
              />
            </FormField>
          </div>
        </FormSection>

        {/* ── 2. O Momento ─────────────────────────────────────────────────── */}
        <FormSection number="2" title="O Momento Especial">
          <FormField
            label="A data especial"
            error={errors.data_especial}
            hint="Usada no contador 'Juntos Há' e no mapa estelar."
          >
            <input
              type="date"
              value={form.data_especial}
              onChange={e => setField('data_especial', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={inputCls('data_especial')}
              style={{ colorScheme: 'dark' }}
            />
          </FormField>

          <FormField
            label="Cidade / Local"
            error={errors.local}
            hint='Exibido na página. Formato recomendado: "Florianópolis — SC".'
          >
            <input
              type="text"
              value={form.local}
              onChange={e => setField('local', e.target.value)}
              placeholder="Ex: Florianópolis — SC"
              className={inputCls('local')}
            />
          </FormField>

          {/* Star map preview + regenerate */}
          <div
            className="rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row items-center gap-4"
            style={{ background: 'rgba(7,7,26,0.5)' }}
          >
            {urlImagem ? (
              <img
                src={urlImagem}
                alt="Mapa estelar"
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 border border-blue-900/40"
                style={{ filter: 'brightness(1.15) contrast(1.35) saturate(1.5)' }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex-shrink-0 border border-blue-900/20 flex items-center justify-center text-xl"
                style={{ background: 'radial-gradient(ellipse at center, #0c1e3a, #04090f)' }}
              >
                ✦
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-stardust text-sm font-sans mb-1">Mapa estelar</p>
              <p className="text-nebula text-xs font-sans mb-3 leading-relaxed">
                Mudou a data ou cidade? Regenere para atualizar o céu. O novo mapa será
                salvo junto com as outras alterações.
              </p>
              <button
                type="button"
                onClick={handleRegenerarMapa}
                disabled={!form.data_especial || regenerating}
                className="inline-flex items-center gap-2 text-xs font-sans px-4 py-2 rounded-full border border-violet-500/30 hover:border-violet-500/50 text-violet-300 hover:text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {regenerating ? (
                  <>
                    <div className="w-3 h-3 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                    Gerando mapa…
                  </>
                ) : (
                  <><span>✦</span> Regenerar Mapa Estelar</>
                )}
              </button>
            </div>
          </div>
        </FormSection>

        {/* ── 3. Carta de Amor ─────────────────────────────────────────────── */}
        <FormSection number="3" title="Carta de Amor">
          <FormField label="Mensagem personalizada" optional error={errors.mensagem_personalizada}>
            <textarea
              value={form.mensagem_personalizada}
              onChange={e => setField('mensagem_personalizada', e.target.value)}
              placeholder="Aquele parágrafo que vai fazer os olhos marejarem… 💜"
              rows={5}
              maxLength={500}
              className={`${inputCls('mensagem_personalizada')} resize-none`}
            />
            <p className="mt-1.5 text-nebula text-xs font-sans text-right">
              {form.mensagem_personalizada.length}/500
            </p>
          </FormField>
        </FormSection>

        {/* ── 4. Música ────────────────────────────────────────────────────── */}
        <FormSection number="4" title="Música do Spotify">
          <FormField
            label="Link da música"
            optional
            error={errors.musica_url}
            hint="Cole a URL de uma faixa do Spotify (open.spotify.com/track/…)"
          >
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                🎵
              </span>
              <input
                type="url"
                value={form.musica_url}
                onChange={e => setField('musica_url', e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className={`${inputCls('musica_url')} pl-9`}
              />
            </div>
          </FormField>

          {/* Spotify compact preview */}
          {spotifyTrackId && (
            <div className="rounded-xl overflow-hidden border border-white/5">
              <iframe
                key={spotifyTrackId}
                src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                style={{ display: 'block', border: 0 }}
              />
            </div>
          )}
        </FormSection>

        {/* ── 5. Endereço da Página ─────────────────────────────────────────── */}
        <FormSection number="5" title="Endereço da Página">
          <FormField
            label="Endereço personalizado"
            error={errors.slug_pagina_exclusiva}
            hint="Letras minúsculas, números e hifens. Mínimo 3 caracteres."
          >
            <div className="flex items-stretch">
              <span
                className="flex-shrink-0 flex items-center px-3 rounded-l-xl border border-r-0 text-nebula text-xs font-mono whitespace-nowrap"
                style={{
                  background: 'rgba(13,13,40,0.8)',
                  borderColor: errors.slug_pagina_exclusiva
                    ? 'rgba(239,68,68,0.4)'
                    : 'rgba(124,58,237,0.25)',
                }}
              >
                /casal/
              </span>
              <input
                type="text"
                value={form.slug_pagina_exclusiva}
                onChange={e => setField('slug_pagina_exclusiva', toSlug(e.target.value))}
                placeholder="ana-e-carlos"
                className={`flex-1 bg-space-800 border ${
                  errors.slug_pagina_exclusiva
                    ? 'border-red-500/50 focus:border-red-400'
                    : 'border-violet-500/25 focus:border-violet-500/60'
                } text-star placeholder-nebula rounded-r-xl px-4 py-3.5 font-sans font-mono text-sm outline-none transition-colors`}
              />
            </div>
            {!errors.slug_pagina_exclusiva && (
              <p className="mt-2 text-nebula/60 text-xs font-mono break-all">
                /casal/{form.slug_pagina_exclusiva || '…'}
              </p>
            )}
          </FormField>
        </FormSection>

        {/* ── 6. Foto do Casal ─────────────────────────────────────────────── */}
        <FormSection number="6" title="Foto do Casal">
          <p className="text-stardust text-xs font-sans -mt-1 mb-1">
            A foto que aparece na sua página pública como uma polaroid.
          </p>
          <PhotoManager
            fotoPreview={fotoPreview}
            onChange={handleFotoChange}
            onRemove={removerFoto}
          />
        </FormSection>

        {/* ── Save button ───────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:from-violet-900 disabled:to-violet-800 text-white font-sans font-semibold text-base px-8 py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5"
          style={{ boxShadow: saving ? 'none' : '0 0 36px rgba(124,58,237,0.38)' }}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              Salvando alterações…
            </>
          ) : (
            <>💜 Salvar Alterações</>
          )}
        </button>

        {/* View page link */}
        <div className="text-center pt-2 pb-4">
          <Link
            href={`/casal/${currentSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm font-sans transition-colors group"
          >
            <span className="group-hover:translate-x-0.5 transition-transform">✨</span>
            Visualizar Página Pública
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>

      {/* ── Toast notification ───────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl animate-fadein-up"
          style={{
            background:
              toast.type === 'success' ? 'rgba(7,7,26,0.96)' : 'rgba(30,7,7,0.96)',
            borderColor:
              toast.type === 'success' ? 'rgba(124,58,237,0.45)' : 'rgba(239,68,68,0.45)',
            backdropFilter: 'blur(14px)',
            maxWidth: 'calc(100vw - 2.5rem)',
          }}
        >
          <span
            className={`text-base flex-shrink-0 ${
              toast.type === 'success' ? 'text-violet-400' : 'text-red-400'
            }`}
          >
            {toast.type === 'success' ? '✓' : '⚠'}
          </span>
          <p
            className={`text-sm font-sans ${
              toast.type === 'success' ? 'text-violet-200' : 'text-red-300'
            }`}
          >
            {toast.message}
          </p>
        </div>
      )}
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="rounded-2xl border border-white/5 p-6 space-y-5"
      style={{ background: 'rgba(13,13,40,0.5)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-sans font-semibold flex-shrink-0"
          style={{
            background: 'rgba(124,58,237,0.22)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: '#c4b5fd',
          }}
        >
          {number}
        </div>
        <h2 className="font-display text-xl text-star">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function FormField({
  label,
  optional,
  error,
  hint,
  children,
}: {
  label: string
  optional?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-stardust text-xs font-sans uppercase tracking-wider mb-2">
        {label}
        {optional && (
          <span className="text-nebula normal-case font-normal tracking-normal ml-1.5">
            (opcional)
          </span>
        )}
      </label>
      {children}
      {error && <p className="mt-1.5 text-red-400 text-xs font-sans">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-nebula text-xs font-sans">{hint}</p>}
    </div>
  )
}

function PhotoManager({
  fotoPreview,
  onChange,
  onRemove,
}: {
  fotoPreview: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}) {
  if (fotoPreview) {
    return (
      <div className="flex items-center gap-5">
        {/* Polaroid preview */}
        <div
          className="bg-white shadow-xl flex-shrink-0"
          style={{ padding: '8px 8px 28px', transform: 'rotate(-2deg)', width: '88px' }}
        >
          <img
            src={fotoPreview}
            alt="Foto do casal"
            className="w-full aspect-square object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="cursor-pointer inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm font-sans underline underline-offset-2 transition-colors">
            Trocar foto
            <input type="file" accept="image/*" onChange={onChange} className="hidden" />
          </label>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-red-400/60 hover:text-red-400 text-sm font-sans underline underline-offset-2 transition-colors text-left"
          >
            Remover foto
          </button>
        </div>
      </div>
    )
  }

  return (
    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-violet-500/20 hover:border-violet-500/45 rounded-2xl p-8 cursor-pointer transition-colors group">
      <div className="w-12 h-12 rounded-full bg-space-800 border border-violet-500/15 group-hover:border-violet-500/40 flex items-center justify-center text-2xl transition-colors">
        📷
      </div>
      <div className="text-center">
        <p className="text-stardust text-sm font-sans">Clique para adicionar uma foto</p>
        <p className="text-nebula text-xs font-sans mt-1">JPG, PNG, HEIC · Máx. 10 MB</p>
      </div>
      <input type="file" accept="image/*" onChange={onChange} className="hidden" />
    </label>
  )
}
