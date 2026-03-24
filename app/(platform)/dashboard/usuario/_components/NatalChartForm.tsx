"use client"

import React, { useActionState, useEffect, startTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod" // force TS re-parse
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { processNatalChartAction } from "../_actions/userActions"

const formSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  birthDate: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  birthTime: z.string().min(1, "La hora exacta es crucial"),
  birthCity: z.string().min(2, "La ciudad de nacimiento es obligatoria"),
})

type FormData = z.infer<typeof formSchema>

export function NatalChartForm() {
  const [state, formAction, isPending] = useActionState(processNatalChartAction, null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  // We wrap the standard Hook Form Submit to dispatch our server action manually 
  // ensuring progressive enhancement while supporting Next.js Server Actions
  const onSubmit = (data: FormData) => {
    startTransition(() => {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("birthDate", data.birthDate)
      formData.append("birthTime", data.birthTime)
      formData.append("birthCity", data.birthCity)
      
      formAction(formData)
    })
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!state?.success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="premium-card p-8 sm:p-10"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nombre Completo
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ej. María Elena"
                  {...register("name")}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm mt-1">
                    {errors.name.message}
                  </motion.p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="birthDate" className="block text-sm font-medium text-foreground">
                    Fecha de Nacimiento
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    {...register("birthDate")}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  {errors.birthDate && (
                    <p className="text-destructive text-sm mt-1">{errors.birthDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="birthTime" className="block text-sm font-medium text-foreground">
                    Hora Exacta
                  </label>
                  <input
                    id="birthTime"
                    type="time"
                    {...register("birthTime")}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  {errors.birthTime && (
                    <p className="text-destructive text-sm mt-1">{errors.birthTime.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="birthCity" className="block text-sm font-medium text-foreground">
                  Ciudad y País de Nacimiento
                </label>
                <input
                  id="birthCity"
                  type="text"
                  placeholder="Ej. Madrid, España"
                  {...register("birthCity")}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {errors.birthCity && (
                  <p className="text-destructive text-sm mt-1">{errors.birthCity.message}</p>
                )}
              </div>

              {state?.error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full gold-gradient text-white font-semibold rounded-lg px-4 py-3.5 mt-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Calculando carta...
                  </>
                ) : (
                  "Desvelar Mi Carta Natal"
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            className="premium-card p-8 sm:p-12 text-center"
          >
            <div className="mb-8">
              <motion.div 
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-7xl mb-6 mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {state.sunSign?.slice(-1) || "✨"}
              </motion.div>
              
              <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
                Tu Signo Solar es {state.sunSign?.slice(0, -2)}
              </h2>
              <p className="text-lg text-muted-foreground">
                Ascendente {state.ascendant} • Luna en {state.moonSign}
              </p>
            </div>
            
            <div className="stat-card text-left mt-8 mb-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <h3 className="section-title text-xl mb-3">Tu Semilla de Transformación</h3>
              <p className="text-muted-foreground leading-relaxed">
                {state.transformationMessage}
              </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="text-primary font-medium hover:underline transition-all"
            >
              Calcular otra carta natal
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
