"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, Volume2, VolumeX } from "lucide-react"

export function ReelPlayer({ src, poster, caption, captionsUrl }: { src: string; poster?: string | null; caption: string; captionsUrl?: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { video.pause(); setPlaying(false) }
      else if (!reducedMotion && !saveData) video.play().then(() => setPlaying(true)).catch(() => undefined)
    }, { threshold: 0.6 })
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().then(() => setPlaying(true))
    else { video.pause(); setPlaying(false) }
  }

  return <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-black">
    <video ref={videoRef} src={src} poster={poster || undefined} playsInline muted={muted} preload="metadata"
      aria-label={`Testimonio en vídeo: ${caption}`} className="h-full w-full object-cover" onClick={toggle} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
      {captionsUrl && <track kind="captions" src={captionsUrl} srcLang="es" label="Español" default />}
    </video>
    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 p-3 pt-10">
      <button type="button" onClick={toggle} className="rounded-full bg-white/90 p-2 text-black" aria-label={playing ? "Pausar vídeo" : "Reproducir vídeo"}>
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <button type="button" onClick={() => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next }}
        className="rounded-full bg-white/90 p-2 text-black" aria-label={muted ? "Activar sonido" : "Silenciar vídeo"}>
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  </div>
}
