import React from "react"
import { NatalChartForm } from "./_components/NatalChartForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tu Carta Natal & Transformación",
  description: "Descubre tu diseño cósmico y tu camino a la transformación en Ainara.",
}

export default function UsuarioDashboardPage() {
  return (
    <div className="page-container py-12 lg:py-20 min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        
        <div className="text-center mb-12 animate-fade-in">
          <p className="label-luxury mb-4 text-primary">Biología & Cosmos</p>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
            Tu Transformación Biológica
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ingresa tus datos exactos de nacimiento para trazar tu carta natal y 
            descubrir cómo tu diseño cósmico interactúa con tu propia evolución personal.
          </p>
          <div className="gold-divider max-w-xs mx-auto mt-8"></div>
        </div>

        {/* 
          Main Natal Chart Layout wrapper for the Form and Results 
          Everything dynamic goes in the Client Component below
        */}
        <div className="w-full max-w-xl">
          <NatalChartForm />
        </div>

      </div>
    </div>
  )
}
