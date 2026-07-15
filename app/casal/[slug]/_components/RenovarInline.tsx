'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Script from 'next/script'
import Link from 'next/link'

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
  mensagem: string
}

interface PixData { qrCode: string; qrCodeBase64: string }

interface Props {
  slug: string
  preco: number
  precoFormatado: string
}

// ── Input helper ──────────────────────────────────────────────────────────────

const inputBase = (hasError: boolean) =>
  [
    'w-full rounded-xl px-4 py-3.5 text-sm font-sans outline-none transition-all duration-200',
    'bg-white/[0.06] text-white/90 placeholder-white/25',
    hasError
      ? 'border border-red-400/50 focus:border-red-400/70'
      : 'border border-purple-500/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
  ].join(' ')

// ── Conteúdo: QR Code Pix ────────────────────────────────────────────────────

function ConteudoPix({ pixData, precoFormatado, slug, onVoltar }: {
  pixData: PixData
  precoFormatado: string
  slug: string
  onVoltar: () => void
}) {
  const [copiado, setCopiado] = useState(false)

  const copiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixData.qrCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch { /* clipboard indisponível */ }
  }, [pixData.qrCode])

  return (
    <div className="text-center animate-fadein-up">
      <p className="text-xs tracking-[4px] uppercase font-sans mb-1" style={{ color: 'rgba(167,139,250,0.6)' }}>
        ✦ &nbsp; Quase lá &nbsp; ✦
      </p>
      <h2 className="font-display text-2xl mb-1" style={{ color: '#f0e6ff' }}>Escaneie o QR Code</h2>
      <p className="text-xs font-sans mb-5 leading-relaxed" style={{ color: 'rgba(203,185,255,0.55)' }}>
        Pague com Pix e seu céu voltará a brilhar em instantes. 💜
      </p>

      {pixData.qrCodeBase64 ? (
        <div className="flex justify-center mb-4">
          <div className="bg-white p-2.5 rounded-xl" style={{ boxShadow: '0 0 24px rgba(167,139,250,0.25)' }}>
            <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" className="w-40 h-40" />
          </div>
        </div>
      ) : (
        <div className="w-40 h-40 mx-auto mb-4 rounded-xl flex items-center justify-center border border-purple-500/20">
          <div className="w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {pixData.qrCode && (
        <div className="mb-4">
          <div className="flex items-center gap-2 rounded-xl p-3 bg-white/[0.04] border border-white/[0.06]">
            <code className="text-xs font-mono flex-1 truncate text-left" style={{ color: 'rgba(203,185,255,0.6)' }}>
              {pixData.qrCode.substring(0, 36)}…
            </code>
            <button
              onClick={copiar}
              className="flex-shrink-0 text-xs font-sans px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: copiado ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.15)',
                color: copiado ? '#c4b5fd' : 'rgba(167,139,250,0.6)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              {copiado ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] font-sans mb-5" style={{ color: 'rgba(167,139,250,0.45)' }}>
        Sua página voltará a ficar ativa em segundos após o pagamento.
      </p>

      <div className="flex flex-col gap-2">
        <Link
          href={`/casal/${slug}`}
          className="block w-full text-center text-sm font-sans font-semibold py-3 rounded-xl transition-all duration-200 text-white"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #9333ea)', boxShadow: '0 0 20px rgba(167,139,250,0.25)' }}
        >
          Ir para minha página →
        </Link>
        <button
          onClick={onVoltar}
          className="text-xs font-sans py-2 transition-colors"
          style={{ color: 'rgba(167,139,250,0.4)' }}
        >
          ← Voltar
        </button>
      </div>

      <p className="mt-4 text-[11px] font-sans" style={{ color: 'rgba(167,139,250,0.3)' }}>
        {precoFormatado} · Pix instantâneo
      </p>
    </div>
  )
}

// ── Conteúdo: Resultado do Cartão ─────────────────────────────────────────────

function ConteudoCartaoResultado({ resultado, slug, onVoltar, onTentarNovamente }: {
  resultado: CartaoResultado
  slug: string
  onVoltar: () => void
  onTentarNovamente: () => void
}) {
  const { status, mensagem } = resultado

  const content = {
    approved: {
      icon: '✨',
      label: '✦   Renovação confirmada   ✦',
      titulo: 'As estrelas voltaram a brilhar!',
      corpo: 'Sua assinatura foi renovada. A página voltará a ficar ativa em instantes. 💜',
    },
    in_process: {
      icon: '⏳',
      label: '✦   Em análise   ✦',
      titulo: 'Pagamento em análise',
      corpo: 'Recebemos seu pagamento. Você receberá um e-mail assim que confirmado.',
    },
    pending: {
      icon: '🕐',
      label: '✦   Aguardando   ✦',
      titulo: 'Aguardando confirmação',
      corpo: 'Seu pedido foi registrado. Você receberá um e-mail em breve.',
    },
    rejected: {
      icon: '💳',
      label: '',
      titulo: 'Cartão recusado',
      corpo: mensagem || 'Não conseguimos processar seu cartão. Verifique os dados ou tente outro cartão.',
    },
  }[status]

  return (
    <div className="text-center animate-fadein-up">
      <div className="text-5xl mb-4">{content.icon}</div>
      {content.label && (
        <p className="text-xs tracking-[4px] uppercase font-sans mb-3" style={{ color: 'rgba(167,139,250,0.6)' }}>
          {content.label}
        </p>
      )}
      <h2 className="font-display text-2xl mb-3" style={{ color: '#f0e6ff' }}>{content.titulo}</h2>
      <p className="text-sm font-sans mb-6 leading-relaxed" style={{ color: 'rgba(203,185,255,0.55)' }}>{content.corpo}</p>

      {status === 'approved' && (
        <Link
          href={`/casal/${slug}`}
          className="block w-full text-center text-white font-sans font-semibold py-3.5 rounded-xl transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #9333ea)', boxShadow: '0 0 20px rgba(167,139,250,0.25)' }}
        >
          Ver nossa página →
        </Link>
      )}
      {status === 'rejected' && (
        <button
          onClick={onTentarNovamente}
          className="w-full text-white font-sans font-semibold py-3.5 rounded-xl transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #9333ea)', boxShadow: '0 0 20px rgba(167,139,250,0.25)' }}
        >
          Tentar novamente
        </button>
      )}
      {(status === 'in_process' || status === 'pending') && (
        <>
          <p className="text-xs font-sans mb-4" style={{ color: 'rgba(167,139,250,0.45)' }}>
            Você pode fechar esta janela — o e-mail chegará assim que aprovado.
          </p>
          <button onClick={onVoltar} className="text-xs font-sans" style={{ color: 'rgba(167,139,250,0.35)' }}>
            ← Voltar
          </button>
        </>
      )}
    </div>
  )
}

// ── Conteúdo: Formulário de Pagamento ────────────────────────────────────────

function ConteudoPagamento({ slug, preco, precoFormatado, mpRef, mpCarregado, onVoltar, onPixData, onCartaoResultado }: {
  slug: string
  preco: number
  precoFormatado: string
  mpRef: React.MutableRefObject<MpInstance | null>
  mpCarregado: boolean
  onVoltar: () => void
  onPixData: (d: PixData) => void
  onCartaoResultado: (r: CartaoResultado) => void
}) {
  const [metodo, setMetodo] = useState<'pix' | 'credit_card'>('pix')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [cartaoNumero, setCartaoNumero] = useState('')
  const [cartaoNome, setCartaoNome] = useState('')
  const [cartaoCpf, setCartaoCpf] = useState('')
  const [cartaoExpiry, setCartaoExpiry] = useState('')
  const [cartaoCvv, setCartaoCvv] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [opcoesParcelamento, setOpcoesParcelamento] = useState<{ installments: number; label: string }[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const digits = cartaoNumero.replace(/\s/g, '')
    if (digits.length < 6 || !mpRef.current) return
    const bin = digits.slice(0, 6)
    const mp = mpRef.current
    mp.getPaymentMethods({ bin }).then(d => setPaymentMethodId(d.results[0]?.id ?? '')).catch(() => {})
    mp.getInstallments({ amount: preco.toFixed(2), bin, paymentTypeId: 'credit_card' })
      .then(d => {
        const costs = d[0]?.payer_costs ?? []
        setOpcoesParcelamento(costs.map(c => ({ installments: c.installments, label: c.recommended_message })))
        setParcelas(1)
      })
      .catch(() => {})
  }, [cartaoNumero, preco, mpRef])

  const handleSubmit = async () => {
    setSubmitError('')

    if (metodo === 'credit_card') {
      const errs: Record<string, string> = {}
      const numDigits = cartaoNumero.replace(/\s/g, '')
      if (numDigits.length < 13) errs.cartaoNumero = 'Número do cartão incompleto'
      if (!cartaoNome.trim()) errs.cartaoNome = 'Informe o nome impresso no cartão'
      if (cartaoCpf.replace(/\D/g, '').length !== 11) errs.cartaoCpf = 'CPF inválido'
      const [mes, ano] = cartaoExpiry.split('/')
      if (!mes || !ano || mes.length !== 2 || ano.length !== 2) errs.cartaoExpiry = 'Data inválida'
      if (cartaoCvv.length < 3) errs.cartaoCvv = 'CVV inválido'
      if (Object.keys(errs).length > 0) { setErrors(errs); return }
    }

    setIsSubmitting(true)
    try {
      if (metodo === 'pix') {
        const res = await fetch('/api/checkout/renovar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, payment_method: 'pix' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar Pix')
        onPixData({ qrCode: data.pix?.qr_code ?? '', qrCodeBase64: data.pix?.qr_code_base64 ?? '' })
        return
      }

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

      const res = await fetch('/api/checkout/renovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, payment_method: 'credit_card',
          token: cardToken.id,
          payment_method_id: paymentMethodId || 'visa',
          installments: parcelas,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao processar pagamento')

      const mpStatus = data.status as string
      const msgs: Record<string, string> = {
        cc_rejected_insufficient_amount: 'Saldo insuficiente no cartão.',
        cc_rejected_bad_filled_card_number: 'Número do cartão incorreto.',
        cc_rejected_bad_filled_date: 'Data de vencimento incorreta.',
        cc_rejected_bad_filled_security_code: 'CVV incorreto.',
        cc_rejected_blacklist: 'Cartão bloqueado. Use outro cartão.',
        cc_rejected_call_for_authorize: 'Ligue para o banco para autorizar.',
        cc_rejected_card_disabled: 'Cartão desativado. Contate o banco.',
        cc_rejected_high_risk: 'Pagamento recusado por segurança.',
      }

      if (mpStatus === 'approved') {
        onCartaoResultado({ status: 'approved', mensagem: '' })
      } else if (mpStatus === 'in_process' || mpStatus === 'pending') {
        onCartaoResultado({ status: mpStatus as 'in_process' | 'pending', mensagem: '' })
      } else {
        onCartaoResultado({ status: 'rejected', mensagem: msgs[data.status_detail] ?? 'Cartão recusado.' })
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="animate-fadein-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] tracking-[3px] uppercase font-sans" style={{ color: 'rgba(167,139,250,0.5)' }}>Renovação</p>
          <p className="font-display text-lg leading-tight" style={{ color: '#f0e6ff' }}>{precoFormatado} · 1 ano</p>
        </div>
        <button onClick={onVoltar} className="text-xs font-sans transition-colors" style={{ color: 'rgba(167,139,250,0.4)' }}>
          ← Voltar
        </button>
      </div>

      {/* Tabs PIX / Cartão */}
      <div className="flex rounded-xl p-1 mb-5 bg-white/[0.04] border border-white/[0.06]">
        {(['pix', 'credit_card'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMetodo(m); setSubmitError('') }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-sans font-medium transition-all duration-200"
            style={metodo === m
              ? { background: 'rgba(109,40,217,0.40)', color: '#e9d5ff', boxShadow: '0 0 12px rgba(124,58,237,0.2)' }
              : { color: 'rgba(255,255,255,0.30)' }}
          >
            <span className="text-base">{m === 'pix' ? '⚡' : '💳'}</span>
            <span>{m === 'pix' ? 'PIX' : 'Cartão'}</span>
          </button>
        ))}
      </div>

      {/* PIX info */}
      {metodo === 'pix' && (
        <p className="text-center text-xs font-sans mb-5" style={{ color: 'rgba(203,185,255,0.5)' }}>
          Pagamento instantâneo. O QR Code será gerado em segundos.
        </p>
      )}

      {/* Formulário cartão */}
      {metodo === 'credit_card' && (
        <div className="space-y-2.5 mb-5">
          <div>
            <input
              type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" maxLength={19}
              value={cartaoNumero}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 16); setCartaoNumero(v.replace(/(.{4})/g, '$1 ').trim()); setErrors(p => ({ ...p, cartaoNumero: '' })) }}
              className={inputBase(!!errors.cartaoNumero)}
            />
            {errors.cartaoNumero && <p className="mt-1 text-red-400/70 text-xs">{errors.cartaoNumero}</p>}
          </div>
          <div>
            <input
              type="text" placeholder="Nome impresso no cartão"
              value={cartaoNome}
              onChange={e => { setCartaoNome(e.target.value.toUpperCase()); setErrors(p => ({ ...p, cartaoNome: '' })) }}
              className={inputBase(!!errors.cartaoNome)}
            />
            {errors.cartaoNome && <p className="mt-1 text-red-400/70 text-xs">{errors.cartaoNome}</p>}
          </div>
          <div>
            <input
              type="text" inputMode="numeric" placeholder="CPF do titular" maxLength={14}
              value={cartaoCpf}
              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setCartaoCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a)); setErrors(p => ({ ...p, cartaoCpf: '' })) }}
              className={inputBase(!!errors.cartaoCpf)}
            />
            {errors.cartaoCpf && <p className="mt-1 text-red-400/70 text-xs">{errors.cartaoCpf}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <input
                type="text" inputMode="numeric" placeholder="MM/AA" maxLength={5}
                value={cartaoExpiry}
                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCartaoExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v); setErrors(p => ({ ...p, cartaoExpiry: '' })) }}
                className={inputBase(!!errors.cartaoExpiry)}
              />
              {errors.cartaoExpiry && <p className="mt-1 text-red-400/70 text-xs">{errors.cartaoExpiry}</p>}
            </div>
            <div>
              <input
                type="text" inputMode="numeric" placeholder="CVV" maxLength={4}
                value={cartaoCvv}
                onChange={e => { setCartaoCvv(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrors(p => ({ ...p, cartaoCvv: '' })) }}
                className={inputBase(!!errors.cartaoCvv)}
              />
              {errors.cartaoCvv && <p className="mt-1 text-red-400/70 text-xs">{errors.cartaoCvv}</p>}
            </div>
          </div>
          {opcoesParcelamento.length > 0 && (
            <select
              value={parcelas}
              onChange={e => setParcelas(Number(e.target.value))}
              className="w-full rounded-xl px-4 py-3.5 text-sm font-sans outline-none bg-white/[0.06] text-white/90 border border-purple-400/20 focus:border-purple-500/60"
            >
              {opcoesParcelamento.map(o => (
                <option key={o.installments} value={o.installments} style={{ background: '#09091e' }}>{o.label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {submitError && (
        <div className="rounded-xl px-4 py-2.5 mb-4 bg-red-500/[0.08] border border-red-400/20">
          <p className="text-red-400/80 text-xs font-sans">{submitError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || (metodo === 'credit_card' && !mpCarregado)}
        className="w-full flex items-center justify-center gap-2 text-white font-sans font-semibold text-sm py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #6d28d9, #9333ea)',
          boxShadow: isSubmitting ? 'none' : '0 0 24px rgba(167,139,250,0.28)',
        }}
      >
        {isSubmitting ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processando…</>
        ) : metodo === 'credit_card' && !mpCarregado ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Carregando…</>
        ) : metodo === 'pix' ? '⚡ Gerar QR Code Pix' : '💳 Confirmar Pagamento'}
      </button>

      <p className="mt-3 text-center text-[10px] font-sans" style={{ color: 'rgba(167,139,250,0.3)' }}>
        🔒 Dados tokenizados pelo Mercado Pago · Não armazenamos cartões
      </p>
    </div>
  )
}

// ── RenovarInline ─────────────────────────────────────────────────────────────

type Tela = 'idle' | 'pagamento' | 'pix' | 'cartao'

export default function RenovarInline({ slug, preco, precoFormatado }: Props) {
  const mpRef = useRef<MpInstance | null>(null)
  const [mpCarregado, setMpCarregado] = useState(false)
  const [tela, setTela] = useState<Tela>('idle')
  const [formJaAberto, setFormJaAberto] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [cartaoResultado, setCartaoResultado] = useState<CartaoResultado | null>(null)

  const abrirPagamento = () => { setFormJaAberto(true); setTela('pagamento') }

  return (
    <>
      {formJaAberto && (
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
          onLoad={() => {
            const key = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ?? ''
            if (key && window.MercadoPago) {
              mpRef.current = new window.MercadoPago(key, { locale: 'pt-BR' })
              setMpCarregado(true)
            }
          }}
        />
      )}

      {/* Estado inicial: botões inline na tela de expiração */}
      {tela === 'idle' && (
        <div className="w-full animate-fadein-up">
          <button
            onClick={abrirPagamento}
            className="block w-full text-center font-sans font-semibold text-[15px] px-8 py-4 rounded-2xl transition-all duration-300 mb-4 text-white"
            style={{
              background: 'linear-gradient(135deg, #6d28d9, #9333ea)',
              boxShadow: '0 0 28px rgba(167,139,250,0.35), 0 0 56px rgba(124,58,237,0.12)',
            }}
          >
            ✨ Despertar Nosso Céu · {precoFormatado}
          </button>
          <Link
            href="/criar"
            className="block w-full text-center text-sm font-sans py-2 transition-colors"
            style={{ color: 'rgba(167,139,250,0.35)' }}
          >
            Criar uma nova memória
          </Link>
        </div>
      )}

      {/* Modal em portal: escapa do ancestral com transform (animate-fadein-up),
          que capturava o position:fixed e espremia o overlay na coluna max-w-sm */}
      {tela !== 'idle' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[#09091e] border border-purple-500/20 shadow-2xl shadow-purple-500/10 z-10">

            {formJaAberto && (
              <div className={tela === 'pagamento' ? '' : 'hidden'}>
                <ConteudoPagamento
                  slug={slug}
                  preco={preco}
                  precoFormatado={precoFormatado}
                  mpRef={mpRef}
                  mpCarregado={mpCarregado}
                  onVoltar={() => setTela('idle')}
                  onPixData={d => { setPixData(d); setTela('pix') }}
                  onCartaoResultado={r => { setCartaoResultado(r); setTela('cartao') }}
                />
              </div>
            )}

            {tela === 'pix' && pixData && (
              <ConteudoPix
                pixData={pixData}
                precoFormatado={precoFormatado}
                slug={slug}
                onVoltar={() => { setPixData(null); setTela('idle') }}
              />
            )}

            {tela === 'cartao' && cartaoResultado && (
              <ConteudoCartaoResultado
                resultado={cartaoResultado}
                slug={slug}
                onVoltar={() => { setCartaoResultado(null); setTela('idle') }}
                onTentarNovamente={() => { setCartaoResultado(null); setTela('pagamento') }}
              />
            )}

          </div>
        </div>,
        document.body
      )}
    </>
  )
}
