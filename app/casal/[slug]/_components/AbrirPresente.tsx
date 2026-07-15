'use client'

import { useState, useEffect } from 'react'

const OVERLAY_STARS = [
  { top: '7%',  left: '11%', size: 3, delay: '0s',   dur: '3.1s', gold: false },
  { top: '14%', left: '80%', size: 2, delay: '0.8s', dur: '4.5s', gold: true  },
  { top: '24%', left: '4%',  size: 2, delay: '1.5s', dur: '2.8s', gold: false },
  { top: '35%', left: '90%', size: 3, delay: '0.3s', dur: '5.2s', gold: false },
  { top: '50%', left: '2%',  size: 2, delay: '2.2s', dur: '3.8s', gold: true  },
  { top: '63%', left: '94%', size: 2, delay: '1.1s', dur: '4.0s', gold: false },
  { top: '72%', left: '7%',  size: 3, delay: '1.9s', dur: '3.3s', gold: false },
  { top: '84%', left: '85%', size: 2, delay: '0.6s', dur: '5.5s', gold: true  },
  { top: '91%', left: '38%', size: 2, delay: '2.7s', dur: '3.0s', gold: false },
  { top: '19%', left: '50%', size: 1, delay: '3.3s', dur: '6.0s', gold: false },
  { top: '58%', left: '47%', size: 1, delay: '1.6s', dur: '4.2s', gold: true  },
  { top: '77%', left: '62%', size: 2, delay: '0.9s', dur: '3.6s', gold: false },
]

export default function AbrirPresente({
  nome1,
  nome2,
  temMusica,
}: {
  nome1: string
  nome2: string
  temMusica: boolean
}) {
  const [state, setState] = useState<'visible' | 'fading' | 'gone'>('visible')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const abrir = () => {
    // Dispatcha ANTES do timeout — gesto do usuário ainda está ativo no browser
    if (temMusica) window.dispatchEvent(new CustomEvent('iniciar-musica'))
    setState('fading')
    document.body.style.overflow = ''
    setTimeout(() => setState('gone'), 650)
  }

  if (state === 'gone') return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{
        background: 'linear-gradient(160deg, #04040f 0%, #07071a 50%, #0d0d28 100%)',
        opacity: state === 'fading' ? 0 : 1,
        transition: 'opacity 0.65s ease',
        pointerEvents: state === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* Top nebula glow */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(124,58,237,0.28) 0%, transparent 70%)' }}
      />
      {/* Bottom nebula glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-52 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
      />

      {/* Twinkling stars */}
      {OVERLAY_STARS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: s.gold ? '#f5d78e' : i % 2 === 0 ? '#c4b5fd' : '#f0e6ff',
            opacity: 0.55,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        />
      ))}

      {/* Center content */}
      <div className="relative text-center max-w-sm w-full animate-fadein-up">

        <p className="text-violet-400/40 text-xs tracking-[8px] uppercase font-sans mb-10">
          ✦ &nbsp; · &nbsp; · &nbsp; · &nbsp; ✦
        </p>

        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center border border-violet-500/20 animate-pulse-glow"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.22) 0%, rgba(7,7,26,0.8) 100%)',
              boxShadow: '0 0 48px rgba(124,58,237,0.22), inset 0 0 20px rgba(124,58,237,0.08)',
            }}
          >
            <span className="text-4xl">🎁</span>
          </div>
        </div>

        {/* Names */}
        <h2 className="font-display italic text-4xl mb-3 leading-tight" style={{ color: '#f0e6ff' }}>
          {nome1} &amp; {nome2}
        </h2>

        {/* Message */}
        <p className="text-sm font-sans mb-2 leading-relaxed" style={{ color: '#9b8cc0' }}>
          prepararam algo especial para você.
        </p>
        <p className="text-xs font-sans mb-10" style={{ color: '#6b5e8a' }}>
          Um momento único guardado nas estrelas. 💜
        </p>

        {/* CTA */}
        <button
          onClick={abrir}
          className="btn-glow inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-sans font-semibold text-base px-10 py-4 rounded-full transition-all duration-300"
          style={{ boxShadow: '0 0 36px rgba(124,58,237,0.45)' }}
        >
          <span>Abrir Presente</span>
          <span className="text-xl">✨</span>
        </button>

        {temMusica && (
          <p className="mt-5 text-xs font-sans" style={{ color: '#4a4070' }}>
            🎵 A música de vocês vai começar
          </p>
        )}

      </div>
    </div>
  )
}
