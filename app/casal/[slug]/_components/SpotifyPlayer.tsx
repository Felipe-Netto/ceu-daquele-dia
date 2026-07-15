'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Music } from 'lucide-react'

interface Props {
  previewUrl: string
  albumArt?: string | null
  trackTitle?: string | null
  artistName?: string | null
}

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function SpotifyPlayer({ previewUrl, albumArt, trackTitle, artistName }: Props) {
  const audioRef    = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying]       = useState(false)
  const [progress, setProgress]     = useState(0)      // 0–1
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]     = useState(0)

  // Play triggered by the user's "Abrir Presente" gesture
  useEffect(() => {
    const handler = () => {
      audioRef.current?.play().catch(() => {
        // Autoplay blocked — user must tap the play button manually
      })
    }
    window.addEventListener('iniciar-musica', handler)
    return () => window.removeEventListener('iniciar-musica', handler)
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause()
    else audio.play().catch(() => {})
  }, [playing])

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    setCurrentTime(audio.currentTime)
    setProgress(audio.currentTime / audio.duration)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration)
  }, [])

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }, [duration])

  return (
    <div
      className="rounded-2xl border border-white/5 p-4"
      style={{ background: 'rgba(7,7,26,0.75)', backdropFilter: 'blur(16px)' }}
    >
      <audio
        ref={audioRef}
        src={previewUrl}
        preload="metadata"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Top row: art + info + play button */}
      <div className="flex items-center gap-3">

        {/* Album art or fallback */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          {albumArt ? (
            <img src={albumArt} alt={trackTitle ?? 'Capa'} className="w-full h-full object-cover" />
          ) : (
            <Music size={20} style={{ color: '#7c3aed', opacity: 0.7 }} />
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-sans font-semibold truncate leading-tight" style={{ color: '#f0e6ff' }}>
            {trackTitle ?? 'Nossa Música Especial'}
          </p>
          {artistName && (
            <p className="text-xs font-sans truncate mt-0.5" style={{ color: '#9b8cc0' }}>
              {artistName}
            </p>
          )}
        </div>

        {/* Play / Pause */}
        <button
          onClick={toggle}
          aria-label={playing ? 'Pausar' : 'Tocar'}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: playing
              ? 'rgba(124,58,237,0.25)'
              : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            boxShadow: playing ? 'none' : '0 0 16px rgba(124,58,237,0.4)',
            border: '1px solid rgba(124,58,237,0.35)',
          }}
        >
          {playing
            ? <Pause  size={16} fill="currentColor" style={{ color: '#c4b5fd' }} />
            : <Play   size={16} fill="currentColor" style={{ color: '#fff', marginLeft: '2px' }} />
          }
        </button>
      </div>

      {/* Progress bar + time */}
      <div className="mt-3 space-y-1.5">
        {/* Clickable progress track */}
        <div
          className="relative h-1 rounded-full cursor-pointer overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          onClick={seekTo}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
            }}
          />
        </div>

        {/* Time labels */}
        <div className="flex justify-between">
          <span className="text-[10px] font-sans tabular-nums" style={{ color: '#6b5e8a' }}>
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] font-sans tabular-nums" style={{ color: '#6b5e8a' }}>
            {duration ? formatTime(duration) : '0:30'}
          </span>
        </div>
      </div>
    </div>
  )
}
