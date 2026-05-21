"use client"

import { Award, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CertificateCardProps {
  userName: string
  formationTitle: string
  issuedAt: string
  certificateNumber: string
  className?: string
}

export function CertificateCard({
  userName,
  formationTitle,
  issuedAt,
  certificateNumber,
  className,
}: CertificateCardProps) {
  const formattedDate = new Date(issuedAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-500/30",
        "bg-gradient-to-br from-amber-950/20 via-background to-amber-950/10",
        "p-8 text-center select-none",
        className,
      )}
    >
      {/* Decorative corner ornaments */}
      <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-amber-500/40 rounded-tl-sm" />
      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-amber-500/40 rounded-tr-sm" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-amber-500/40 rounded-bl-sm" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-amber-500/40 rounded-br-sm" />

      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30">
          <Award className="h-8 w-8 text-amber-500" />
        </div>
      </div>

      {/* Header */}
      <p className="text-xs uppercase tracking-[0.25em] text-amber-500/70 font-medium mb-3">
        Certificado de Finalización
      </p>

      {/* This certifies */}
      <p className="text-sm text-muted-foreground mb-2">Este certificado acredita que</p>

      {/* User name */}
      <h2 className="font-display text-3xl font-semibold text-foreground mb-2 leading-tight">
        {userName}
      </h2>

      <p className="text-sm text-muted-foreground mb-2">ha completado satisfactoriamente</p>

      {/* Formation name */}
      <h3 className="font-display text-xl font-medium text-amber-500 mb-5 leading-tight">
        {formationTitle}
      </h3>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-amber-500/20" />
        <Sparkles className="h-3.5 w-3.5 text-amber-500/60" />
        <div className="flex-1 h-px bg-amber-500/20" />
      </div>

      {/* Date and number */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="text-left">
          <p className="text-[10px] uppercase tracking-wider mb-0.5 text-muted-foreground/60">Fecha</p>
          <p>{formattedDate}</p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-amber-500/60" />
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider mb-0.5 text-muted-foreground/60">Certificado Nº</p>
          <p className="font-mono">{certificateNumber}</p>
        </div>
      </div>
    </div>
  )
}
