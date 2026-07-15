'use client'

import React, { useState, useEffect } from 'react'

interface Tempo {
  anos: number
  meses: number
  dias: number
  horas: number
  minutos: number
  segundos: number
}

function calcularTempo(dataEspecial: string): Tempo {
  const inicio = new Date(dataEspecial + 'T00:00:00')
  const agora = new Date()

  let anos = agora.getFullYear() - inicio.getFullYear()
  let meses = agora.getMonth() - inicio.getMonth()
  let dias = agora.getDate() - inicio.getDate()

  if (dias < 0) {
    meses--
    dias += new Date(agora.getFullYear(), agora.getMonth(), 0).getDate()
  }
  if (meses < 0) {
    anos--
    meses += 12
  }

  const totalSeg = Math.max(0, Math.floor((agora.getTime() - inicio.getTime()) / 1000))
  const horas = Math.floor((totalSeg % 86400) / 3600)
  const minutos = Math.floor((totalSeg % 3600) / 60)
  const segundos = totalSeg % 60

  return { anos, meses, dias, horas, minutos, segundos }
}

export default function ContadorTempo({ dataEspecial }: { dataEspecial: string }) {
  const [tempo, setTempo] = useState<Tempo | null>(null)

  useEffect(() => {
    setTempo(calcularTempo(dataEspecial))
    const id = setInterval(() => setTempo(calcularTempo(dataEspecial)), 1000)
    return () => clearInterval(id)
  }, [dataEspecial])

  const bloco = (valor: number, label: string) => (
    <div key={label} className="flex flex-col items-center gap-1">
      <span className="font-display text-4xl italic leading-none" style={{ color: '#f0e6ff' }}>
        {valor}
      </span>
      <span className="text-[10px] font-sans uppercase tracking-widest" style={{ color: '#6b5e8a' }}>
        {label}
      </span>
    </div>
  )

  const blocoSec = (valor: number, label: string) => (
    <div key={label} className="flex items-baseline gap-0.5">
      <span className="font-display text-xl italic" style={{ color: '#9b8cc0' }}>
        {String(valor).padStart(2, '0')}
      </span>
      <span className="text-xs font-sans" style={{ color: '#4a4070' }}>{label}</span>
    </div>
  )

  const container = (children: React.ReactNode) => (
    <div
      className="rounded-2xl px-5 py-6 border border-white/5 text-center"
      style={{ background: 'rgba(7,7,26,0.6)', backdropFilter: 'blur(12px)' }}
    >
      <p className="text-[10px] font-sans uppercase tracking-[4px] mb-5" style={{ color: '#6b5e8a' }}>
        ✦ &nbsp; juntos há &nbsp; ✦
      </p>
      {children}
    </div>
  )

  if (!tempo) {
    return container(
      <div className="flex justify-center gap-8 animate-pulse">
        {['anos', 'meses', 'dias'].map(l => (
          <div key={l} className="flex flex-col items-center gap-2">
            <div className="w-10 h-9 rounded-lg" style={{ background: 'rgba(167,139,250,0.08)' }} />
            <div className="w-8 h-2 rounded" style={{ background: 'rgba(107,94,138,0.15)' }} />
          </div>
        ))}
      </div>
    )
  }

  return container(
    <>
      <div className="flex justify-center gap-8 mb-5">
        {bloco(tempo.anos,  tempo.anos  === 1 ? 'ano'  : 'anos')}
        {bloco(tempo.meses, tempo.meses === 1 ? 'mês'  : 'meses')}
        {bloco(tempo.dias,  tempo.dias  === 1 ? 'dia'  : 'dias')}
      </div>

      <div className="h-px mb-4" style={{ background: 'linear-gradient(to right, transparent, rgba(167,139,250,0.15), transparent)' }} />

      <div className="flex justify-center gap-5">
        {blocoSec(tempo.horas,   'h')}
        <span className="font-display text-xl italic" style={{ color: '#4a4070' }}>:</span>
        {blocoSec(tempo.minutos, 'm')}
        <span className="font-display text-xl italic" style={{ color: '#4a4070' }}>:</span>
        {blocoSec(tempo.segundos, 's')}
      </div>
    </>
  )
}
