"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// ─── YouTube IFrame API types ────────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        config: {
          videoId: string
          playerVars?: Record<string, unknown>
          events?: {
            onReady?: () => void
            onStateChange?: (event: { data: number }) => void
          }
        }
      ) => YTPlayerInstance
      PlayerState: { ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 }
    }
    onYouTubeIframeAPIReady?: () => void
    _ytApiPromise?: Promise<void>
  }
}

interface YTPlayerInstance {
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  destroy: () => void
}

// ─── Shared props ─────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  src: string
  poster?: string
  title?: string
  lessonId?: string
  onProgress?: (currentTime: number, duration: number) => void
  onComplete?: () => void
  initialProgress?: number
  autoTrackProgress?: boolean
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const COMPLETION_THRESHOLD = 0.9
const TRACK_INTERVAL_MS = 10_000

// ─── URL detection ────────────────────────────────────────────────────────────

type VideoType = "youtube" | "vimeo" | "native"

function detectVideoType(src: string): VideoType {
  if (!src) return "native"
  const lower = src.toLowerCase()
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube"
  if (lower.includes("vimeo.com")) return "vimeo"
  return "native" // covers Cloudflare Stream, MP4, WebM, HLS, etc.
}

function extractYouTubeId(url: string): string {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?#]+)/,
    /youtube\.com\/embed\/([^?#]+)/,
    /youtube\.com\/shorts\/([^?#]+)/,
  ]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return ""
}

function extractVimeoId(url: string): string {
  const m = url.match(/vimeo\.com\/(\d+)/)
  return m ? m[1] : ""
}

// ─── Load YouTube IFrame API (singleton) ─────────────────────────────────────

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (window._ytApiPromise) return window._ytApiPromise

  window._ytApiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(script)
    }
  })

  return window._ytApiPromise
}

// ─── YouTube Player ───────────────────────────────────────────────────────────

function YouTubePlayer({
  src,
  onProgress,
  onComplete,
  initialProgress = 0,
  autoTrackProgress = true,
  className,
}: Omit<VideoPlayerProps, "poster" | "title" | "lessonId">) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayerInstance | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasCompletedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const videoId = extractYouTubeId(src)

  // Stable callbacks via refs so we don't re-run the effect on every render
  const onProgressRef = useRef(onProgress)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onProgressRef.current = onProgress }, [onProgress])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    if (!containerRef.current || !videoId) return
    let destroyed = false

    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          start: Math.floor(initialProgress),
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!destroyed) setIsLoaded(true)
          },
          onStateChange: (event) => {
            if (destroyed) return
            // Video ended → trigger completion
            if (event.data === 0 && !hasCompletedRef.current) {
              hasCompletedRef.current = true
              onCompleteRef.current?.()
            }
          },
        },
      })
    })

    return () => {
      destroyed = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId, initialProgress])

  // Progress tracking — starts only after player is ready
  useEffect(() => {
    if (!isLoaded || !autoTrackProgress) return

    intervalRef.current = setInterval(() => {
      const p = playerRef.current
      if (!p || p.getPlayerState() !== 1) return // 1 = playing

      const currentTime = p.getCurrentTime()
      const duration = p.getDuration()
      onProgressRef.current?.(currentTime, duration)

      if (!hasCompletedRef.current && duration > 0 && currentTime / duration >= COMPLETION_THRESHOLD) {
        hasCompletedRef.current = true
        onCompleteRef.current?.()
      }
    }, TRACK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLoaded, autoTrackProgress])

  return (
    // aspect-video aquí porque YT.Player reemplaza containerRef con un <iframe>
    // y ese iframe no hereda las clases CSS — sin aspect-video en el outer div
    // el contenedor colapsa y queda área negra debajo del iframe.
    // [&>iframe]:* fuerza al iframe generado por YT a llenar el contenedor.
    <div className={cn(
      "relative bg-black rounded-lg overflow-hidden aspect-video",
      "[&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full",
      className
    )}>
      {/* YT.Player reemplaza este div con un <iframe> */}
      <div ref={containerRef} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white" />
            <p className="text-white/60 text-sm">Cargando video...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Vimeo Player ─────────────────────────────────────────────────────────────

function VimeoPlayer({
  src,
  className,
}: Pick<VideoPlayerProps, "src" | "className">) {
  const videoId = extractVimeoId(src)

  return (
    <div className={cn("relative bg-black rounded-lg overflow-hidden", className)}>
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0`}
        className="w-full aspect-video"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
        allowFullScreen
        title="Vimeo video player"
      />
    </div>
  )
}

// ─── Native Video Player (Cloudflare Stream, MP4, WebM, HLS) ─────────────────

function NativePlayer({
  src,
  poster,
  title,
  onProgress,
  onComplete,
  initialProgress = 0,
  autoTrackProgress = true,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoaded = () => {
      setDuration(video.duration)
      if (initialProgress > 0 && initialProgress < video.duration) {
        video.currentTime = initialProgress
      }
    }
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      if (!hasCompleted && video.duration > 0 && video.currentTime / video.duration >= COMPLETION_THRESHOLD) {
        setHasCompleted(true)
        onComplete?.()
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsBuffering(true)
    const onCanPlay = () => setIsBuffering(false)

    video.addEventListener("loadedmetadata", onLoaded)
    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("canplay", onCanPlay)

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded)
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("canplay", onCanPlay)
    }
  }, [initialProgress, hasCompleted, onComplete])

  useEffect(() => {
    if (autoTrackProgress && isPlaying) {
      progressInterval.current = setInterval(() => {
        if (videoRef.current) {
          onProgress?.(videoRef.current.currentTime, videoRef.current.duration)
        }
      }, TRACK_INTERVAL_MS)
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [autoTrackProgress, isPlaying, onProgress])

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFSChange)
    return () => document.removeEventListener("fullscreenchange", onFSChange)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "ArrowLeft":
          e.preventDefault()
          skip(-10)
          break
        case "ArrowRight":
          e.preventDefault()
          skip(10)
          break
        case "ArrowUp":
          e.preventDefault()
          handleVolumeChange([Math.min(1, volume + 0.1)])
          break
        case "ArrowDown":
          e.preventDefault()
          handleVolumeChange([Math.max(0, volume - 0.1)])
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [volume]) // eslint-disable-line react-hooks/exhaustive-deps

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setShowControls(false)
    }, 3000)
  }, [])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      void v.play()
    } else {
      v.pause()
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (isFullscreen) await document.exitFullscreen()
    else await containerRef.current.requestFullscreen()
  }

  const skip = (seconds: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(duration, v.currentTime + seconds))
  }

  const handleSeek = (value: number[]) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0]
    setVolume(newVol)
    setIsMuted(newVol === 0)
    const v = videoRef.current
    if (!v) return
    v.volume = newVol
    v.muted = newVol === 0
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    const v = videoRef.current
    if (v) v.playbackRate = speed
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        isFullscreen && "rounded-none",
        className
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
        playsInline
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white" />
        </div>
      )}

      {!isPlaying && !isBuffering && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
            <Play className="h-10 w-10 text-black ml-1" />
          </div>
        </button>
      )}

      {hasCompleted && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />
          Completado
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => skip(-10)}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => skip(10)}>
              <SkipForward className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 group/volume">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-200">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <span className="text-white text-sm tabular-nums ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-sm">
                  {playbackSpeed}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={cn(playbackSpeed === speed && "bg-accent")}
                  >
                    {speed}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Calidad: Auto</DropdownMenuItem>
                <DropdownMenuItem>Subtítulos: Off</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {title && (
          <p className="text-white text-sm mt-2 truncate opacity-75">{title}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main VideoPlayer (router) ────────────────────────────────────────────────

export function VideoPlayer(props: VideoPlayerProps) {
  const type = detectVideoType(props.src)

  if (type === "youtube") {
    return <YouTubePlayer {...props} />
  }

  if (type === "vimeo") {
    return <VimeoPlayer src={props.src} className={props.className} />
  }

  // Native: Cloudflare Stream, MP4, WebM, HLS — mantiene el player completo
  return <NativePlayer {...props} />
}
