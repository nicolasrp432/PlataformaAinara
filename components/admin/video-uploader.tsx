"use client"

import { useState, useRef, useCallback } from "react"
import * as tus from "tus-js-client"
import { 
  Upload, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Play,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface VideoUploaderProps {
  lessonId?: string
  currentVideoUrl?: string | null
  currentDuration?: number
  onUploadComplete: (data: {
    videoId: string
    videoUrl: string
    duration: number
    thumbnail: string
  }) => void
  onUploadError?: (error: Error) => void
  className?: string
}

type UploadStatus = 
  | "idle" 
  | "preparing" 
  | "uploading" 
  | "processing" 
  | "ready" 
  | "error"

interface UploadState {
  status: UploadStatus
  progress: number
  error?: string
  videoId?: string
}

export function VideoUploader({
  lessonId,
  currentVideoUrl,
  currentDuration,
  onUploadComplete,
  onUploadError,
  className,
}: VideoUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: currentVideoUrl ? "ready" : "idle",
    progress: 0,
  })
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<tus.Upload | null>(null)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const pollVideoStatus = useCallback(async (videoId: string) => {
    const maxAttempts = 60 // 5 minutes max
    let attempts = 0
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/upload?videoId=${videoId}`)
        const data = await response.json()
        
        if (data.readyToStream) {
          setUploadState({
            status: "ready",
            progress: 100,
            videoId,
          })
          
          onUploadComplete({
            videoId,
            videoUrl: data.playback?.hls || `https://customer-xxx.cloudflarestream.com/${videoId}/manifest/video.m3u8`,
            duration: data.duration || 0,
            thumbnail: data.thumbnail || "",
          })
          return
        }
        
        if (data.status === "error") {
          setUploadState({
            status: "error",
            progress: 0,
            error: "El video no pudo ser procesado",
          })
          onUploadError?.(new Error("Video processing failed"))
          return
        }
        
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000) // Check every 5 seconds
        } else {
          setUploadState({
            status: "error",
            progress: 0,
            error: "Timeout esperando el procesamiento del video",
          })
        }
      } catch (error) {
        console.error("Error checking video status:", error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000)
        }
      }
    }
    
    checkStatus()
  }, [onUploadComplete, onUploadError])

  const handleUpload = useCallback(async (file: File) => {
    // Validate file
    const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]
    if (!validTypes.includes(file.type)) {
      setUploadState({
        status: "error",
        progress: 0,
        error: "Formato no soportado. Usa MP4, MOV o WebM.",
      })
      return
    }
    
    const maxSize = 5 * 1024 * 1024 * 1024 // 5GB
    if (file.size > maxSize) {
      setUploadState({
        status: "error",
        progress: 0,
        error: "El archivo es demasiado grande. Maximo 5GB.",
      })
      return
    }
    
    setUploadState({ status: "preparing", progress: 0 })
    
    try {
      // Get upload URL from our API
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          lessonId,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to get upload URL")
      }
      
      const { uploadUrl, videoId } = await response.json()
      
      // Create TUS upload
      const upload = new tus.Upload(file, {
        endpoint: uploadUrl,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 50 * 1024 * 1024, // 50MB chunks
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: (error) => {
          console.error("Upload error:", error)
          setUploadState({
            status: "error",
            progress: 0,
            error: "Error al subir el video. Por favor intenta de nuevo.",
          })
          onUploadError?.(error)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100)
          setUploadState({
            status: "uploading",
            progress: percentage,
            videoId,
          })
        },
        onSuccess: () => {
          setUploadState({
            status: "processing",
            progress: 100,
            videoId,
          })
          // Poll for video processing status
          pollVideoStatus(videoId)
        },
      })
      
      uploadRef.current = upload
      
      // Check for previous upload
      const previousUploads = await upload.findPreviousUploads()
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      
      setUploadState({ status: "uploading", progress: 0, videoId })
      upload.start()
    } catch (error) {
      console.error("Upload preparation error:", error)
      setUploadState({
        status: "error",
        progress: 0,
        error: "Error al preparar la subida. Verifica tu conexion.",
      })
      onUploadError?.(error as Error)
    }
  }, [lessonId, onUploadError, pollVideoStatus])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }, [handleUpload])

  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort()
    }
    setUploadState({ status: "idle", progress: 0 })
  }, [])

  const resetUploader = useCallback(() => {
    setUploadState({ status: "idle", progress: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Ready State - Video exists */}
      {uploadState.status === "ready" && currentVideoUrl && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="h-8 w-8" />
                </div>
                <p className="text-sm opacity-80">Video cargado correctamente</p>
                {currentDuration && (
                  <p className="text-xs opacity-60 mt-1">
                    Duracion: {formatDuration(currentDuration)}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Video listo</p>
                <p className="text-sm text-muted-foreground">
                  {currentDuration ? formatDuration(currentDuration) : "Procesado"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reemplazar
            </Button>
          </div>
        </div>
      )}
      
      {/* Idle State - No video */}
      {uploadState.status === "idle" && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Subir Video</h3>
          <p className="text-muted-foreground mb-4">
            Arrastra tu video aqui o haz click para seleccionar
          </p>
          <p className="text-sm text-muted-foreground">
            MP4, MOV o WebM hasta 5GB
          </p>
        </div>
      )}
      
      {/* Preparing State */}
      {uploadState.status === "preparing" && (
        <div className="border rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Video className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Preparando subida...</p>
              <p className="text-sm text-muted-foreground">
                Conectando con el servidor de video
              </p>
            </div>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </div>
      )}
      
      {/* Uploading State */}
      {uploadState.status === "uploading" && (
        <div className="border rounded-lg p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Subiendo video...</p>
              <p className="text-sm text-muted-foreground">
                Por favor no cierres esta ventana
              </p>
            </div>
            <span className="text-lg font-semibold tabular-nums">
              {uploadState.progress}%
            </span>
            <Button variant="ghost" size="icon" onClick={cancelUpload}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={uploadState.progress} className="h-2" />
        </div>
      )}
      
      {/* Processing State */}
      {uploadState.status === "processing" && (
        <div className="border rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Video className="h-6 w-6 text-secondary animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Procesando video...</p>
              <p className="text-sm text-muted-foreground">
                Generando versiones optimizadas para diferentes dispositivos
              </p>
            </div>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </div>
      )}
      
      {/* Error State */}
      {uploadState.status === "error" && (
        <div className="border border-destructive rounded-lg p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-destructive">Error al subir</p>
              <p className="text-sm text-muted-foreground">
                {uploadState.error || "Ha ocurrido un error. Por favor intenta de nuevo."}
              </p>
            </div>
            <Button variant="outline" onClick={resetUploader}>
              Reintentar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
