"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Sparkles, BookOpen, Users, Trophy, Heart, Star, Gem,
  ArrowRight, Play, Check, Menu, X, ChevronDown,
  Zap, Shield, Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FormationsCarousel } from "./formations-carousel"
import { RegisterModal } from "./register-modal"

interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  difficulty: string | null
  duration_minutes: number | null
  is_premium: boolean | null
  xp_reward: number | null
}

interface LandingPageProps {
  formations: Formation[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

export function LandingPage({ formations }: LandingPageProps) {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        {/* ── HEADER ── */}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent transition-transform group-hover:scale-110">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl font-light tracking-wide">Ainara</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 md:flex">
              {[
                { href: "#formaciones", label: "Formaciones" },
                { href: "#como-funciona", label: "Cómo funciona" },
                { href: "#precios", label: "Precios" },
              ].map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </a>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden items-center gap-3 md:flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                onClick={() => setRegisterOpen(true)}
              >
                Comenzar ahora
              </Button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border/50 bg-background overflow-hidden md:hidden"
              >
                <div className="flex flex-col gap-1 px-6 py-4">
                  {[
                    { href: "#formaciones", label: "Formaciones" },
                    { href: "#como-funciona", label: "Cómo funciona" },
                    { href: "#precios", label: "Precios" },
                  ].map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                  <div className="mt-4 flex flex-col gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login">Iniciar sesión</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      onClick={() => { setRegisterOpen(true); setMobileMenuOpen(false) }}
                    >
                      Comenzar ahora
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1">
          {/* ── HERO ── */}
          <section
            ref={heroRef}
            className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-48"
          >
            {/* Ambient blobs */}
            <motion.div
              className="animate-float pointer-events-none absolute -top-20 right-1/3 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[100px]"
              style={{ y: heroY }}
            />
            <motion.div
              className="animate-float-slow pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[120px]"
              style={{ y: heroY }}
            />
            <motion.div
              className="animate-float-delay pointer-events-none absolute top-1/3 left-10 h-64 w-64 rounded-full bg-primary/5 blur-[80px]"
            />

            <motion.div
              className="relative mx-auto max-w-5xl px-6 text-center"
              style={{ opacity: heroOpacity }}
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* Eyebrow badge */}
              <motion.div variants={fadeUp} className="mb-8 flex justify-center">
                <Badge
                  variant="outline"
                  className="gap-2 rounded-full border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
                >
                  <Gem className="h-3.5 w-3.5" />
                  Plataforma de Transformación Personal
                </Badge>
              </motion.div>

              {/* Main headline */}
              <motion.h1
                variants={fadeUp}
                className="font-display mb-8 text-balance text-6xl font-light leading-[1.08] tracking-tight text-foreground sm:text-7xl lg:text-8xl"
              >
                Tu viaje hacia la{" "}
                <span className="text-gold-gradient italic font-normal">
                  transformación
                </span>{" "}
                <br className="hidden lg:block" />
                comienza aquí
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl"
              >
                Formaciones profundas, mentoría personalizada y una comunidad que
                te acompaña en tu camino de crecimiento personal y espiritual.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-primary to-accent text-primary-foreground text-base hover:opacity-90 shadow-lg shadow-primary/20"
                  onClick={() => setRegisterOpen(true)}
                >
                  Comenzar mi viaje
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 border-border/60 text-base hover:border-primary/40 hover:bg-primary/5"
                  asChild
                >
                  <a href="#formaciones">
                    <Play className="mr-2 h-4 w-4" />
                    Ver formaciones
                  </a>
                </Button>
              </motion.div>

              {/* Social proof numbers */}
              <motion.div
                variants={fadeUp}
                className="mt-16 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16"
              >
                {[
                  { value: "500+", label: "Estudiantes activos" },
                  { value: "20+", label: "Formaciones disponibles" },
                  { value: "98%", label: "Satisfacción" },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <p className="font-display text-4xl font-light text-foreground">{value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Scroll hint */}
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground/50" />
            </motion.div>
          </section>

          {/* ── FEATURES STRIP ── */}
          <section className="border-y border-border/40 bg-muted/20 py-6">
            <div className="mx-auto max-w-7xl px-6">
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                {[
                  { icon: Zap, text: "Acceso inmediato al contenido" },
                  { icon: Shield, text: "Comunidad privada y curada" },
                  { icon: Globe, text: "Aprende a tu propio ritmo" },
                  { icon: Star, text: "Certificados verificables" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary/70" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FORMATIONS CAROUSEL ── */}
          <section id="formaciones" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-6">
              <motion.div
                className="mb-16"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
              >
                <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
                  <div className="h-px w-8 bg-primary/60" />
                  <span className="text-sm font-medium uppercase tracking-widest text-primary/80">
                    Nuestras formaciones
                  </span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="font-display text-5xl font-light leading-tight sm:text-6xl"
                >
                  Cambia tu vida con{" "}
                  <span className="text-gold-gradient italic">formaciones</span>
                  <br className="hidden sm:block" /> que transforman
                </motion.h2>
                <motion.p variants={fadeUp} className="mt-4 max-w-xl text-muted-foreground leading-relaxed">
                  Cada formación está diseñada para guiarte en un aspecto específico
                  de tu desarrollo personal, espiritual y profesional.
                </motion.p>
              </motion.div>

              <FormationsCarousel formations={formations} />
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section id="como-funciona" className="py-24 lg:py-32 bg-muted/20">
            <div className="mx-auto max-w-7xl px-6">
              <motion.div
                className="mb-20 max-w-2xl"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
              >
                <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
                  <div className="h-px w-8 bg-primary/60" />
                  <span className="text-sm font-medium uppercase tracking-widest text-primary/80">
                    El proceso
                  </span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="font-display text-5xl font-light sm:text-6xl">
                  Cómo funciona
                </motion.h2>
                <motion.p variants={fadeUp} className="mt-4 text-muted-foreground leading-relaxed">
                  Un camino claro hacia tu transformación personal.
                </motion.p>
              </motion.div>

              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    icon: BookOpen,
                    title: "Regístrate",
                    desc: "Crea tu cuenta y solicita acceso. El equipo revisa tu solicitud o puedes activar acceso inmediato con una suscripción.",
                  },
                  {
                    step: "02",
                    icon: Play,
                    title: "Elige tu formación",
                    desc: "Explora nuestras formaciones en desarrollo personal, espiritualidad y liderazgo. Aprende a tu ritmo.",
                  },
                  {
                    step: "03",
                    icon: Trophy,
                    title: "Transforma tu vida",
                    desc: "Aplica lo aprendido, gana XP, únete a la comunidad y comparte tu progreso con mentores.",
                  },
                ].map(({ step, icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={step}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.1 }}
                    className="relative"
                  >
                    {/* Connector line */}
                    {i < 2 && (
                      <div className="absolute top-8 left-[calc(100%+1rem)] hidden h-px w-[calc(100%-2rem)] border-t border-dashed border-border/60 md:block" />
                    )}
                    <div className="rounded-2xl border border-border/50 bg-card p-8 transition-shadow hover:shadow-md hover:shadow-primary/5">
                      <div className="mb-6 flex items-center gap-4">
                        <span className="font-display text-4xl font-light text-primary/30">{step}</span>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHAT'S INSIDE ── */}
          <section className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-6">
              <div className="grid items-center gap-16 lg:grid-cols-2">
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                >
                  <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
                    <div className="h-px w-8 bg-primary/60" />
                    <span className="text-sm font-medium uppercase tracking-widest text-primary/80">
                      Qué incluye
                    </span>
                  </motion.div>
                  <motion.h2
                    variants={fadeUp}
                    className="font-display mb-6 text-5xl font-light sm:text-6xl"
                  >
                    Todo lo que necesitas para crecer
                  </motion.h2>
                  <motion.p
                    variants={fadeUp}
                    className="mb-10 text-muted-foreground leading-relaxed"
                  >
                    Una plataforma completa diseñada para guiarte en cada paso de
                    tu desarrollo personal.
                  </motion.p>
                  <motion.div variants={stagger} className="space-y-4">
                    {[
                      { icon: BookOpen, title: "Formaciones en video", desc: "Lecciones estructuradas con ejercicios y recursos descargables" },
                      { icon: Users, title: "Comunidad La Taberna", desc: "Conecta con personas que comparten tu camino de crecimiento" },
                      { icon: Heart, title: "Diario de reflexiones", desc: "Espacio personal para documentar tus insights y claridades" },
                      { icon: Trophy, title: "Sistema de progreso", desc: "XP, rachas diarias y logros que celebran tu dedicación" },
                    ].map(({ icon: Icon, title, desc }) => (
                      <motion.div
                        key={title}
                        variants={fadeUp}
                        className="flex items-start gap-4 rounded-xl p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{title}</p>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Visual side */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="relative hidden lg:block"
                >
                  <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 shadow-xl shadow-primary/5">
                    <div className="card-grain absolute inset-0 rounded-3xl" />
                    <div className="relative space-y-4">
                      {/* Mock course card */}
                      <div className="rounded-2xl bg-card/80 p-5 shadow-sm backdrop-blur">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Despertar de la Consciencia</p>
                            <p className="text-xs text-muted-foreground">8h · Intermedio</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-primary to-accent" />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">60% completado</p>
                      </div>
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Nivel", value: "12" },
                          { label: "XP Total", value: "2,840" },
                          { label: "Racha", value: "21 días" },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-xl bg-card/80 p-3 text-center backdrop-blur">
                            <p className="font-display text-2xl font-light text-primary">{value}</p>
                            <p className="text-xs text-muted-foreground">{label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Community snippet */}
                      <div className="rounded-2xl bg-card/80 p-4 backdrop-blur">
                        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comunidad</p>
                        <div className="flex -space-x-2">
                          {["A", "M", "S", "R", "L"].map((l) => (
                            <div key={l} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-primary/30 to-accent/30 text-xs font-semibold">
                              {l}
                            </div>
                          ))}
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-xs text-muted-foreground">
                            +
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">500+ miembros activos</p>
                      </div>
                    </div>
                  </div>
                  {/* Floating badge */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-4 -bottom-4 rounded-2xl border border-primary/20 bg-card px-4 py-3 shadow-lg shadow-primary/5"
                  >
                    <p className="text-xs text-muted-foreground">Nuevo logro</p>
                    <p className="font-semibold text-sm">🏆 Explorador Consciente</p>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section id="precios" className="py-24 lg:py-32 bg-muted/20">
            <div className="mx-auto max-w-7xl px-6">
              <motion.div
                className="mb-16 text-center"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
              >
                <motion.div variants={fadeUp} className="mb-4 flex justify-center items-center gap-3">
                  <div className="h-px w-8 bg-primary/60" />
                  <span className="text-sm font-medium uppercase tracking-widest text-primary/80">Inversión</span>
                  <div className="h-px w-8 bg-primary/60" />
                </motion.div>
                <motion.h2 variants={fadeUp} className="font-display text-5xl font-light sm:text-6xl">
                  Planes de acceso
                </motion.h2>
                <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
                  Elige el plan que mejor se adapte a tu camino de transformación.
                </motion.p>
              </motion.div>

              <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
                {/* Free / Pending */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="rounded-3xl border border-border/60 bg-card p-8"
                >
                  <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">Acceso curado</p>
                  <p className="font-display mb-1 text-4xl font-light">Gratis</p>
                  <p className="mb-6 text-sm text-muted-foreground">Solicitud de acceso manual</p>
                  <ul className="mb-8 space-y-3">
                    {[
                      "Lecciones de preview gratuitas",
                      "Acceso a la comunidad",
                      "Diario de reflexiones",
                      "Revisión manual por el equipo",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full border-border/60 hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => setRegisterOpen(true)}
                  >
                    Solicitar acceso
                  </Button>
                </motion.div>

                {/* Premium */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 shadow-xl shadow-primary/10"
                >
                  <div className="card-grain absolute inset-0 rounded-3xl" />
                  <div className="relative">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      <Sparkles className="h-3 w-3" /> Más popular
                    </div>
                    <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">Suscripción</p>
                    <div className="mb-1 flex items-end gap-2">
                      <span className="font-display text-5xl font-light">€97</span>
                      <span className="mb-2 text-muted-foreground">/mes</span>
                    </div>
                    <p className="mb-6 text-sm text-muted-foreground">Acceso completo inmediato</p>
                    <ul className="mb-8 space-y-3">
                      {[
                        "Todas las formaciones completas",
                        "Nuevas formaciones cada mes",
                        "Comunidad privada exclusiva",
                        "Sesiones de mentoría grupal",
                        "Certificados verificables",
                        "Acceso inmediato sin esperas",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                      onClick={() => setRegisterOpen(true)}
                    >
                      Comenzar ahora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── CTA FINAL ── */}
          <section className="py-24 lg:py-32">
            <div className="mx-auto max-w-4xl px-6 text-center">
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
              >
                <motion.div variants={fadeUp} className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="font-display mb-6 text-5xl font-light leading-tight sm:text-6xl"
                >
                  El momento es{" "}
                  <span className="text-gold-gradient italic">ahora</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="mb-10 text-muted-foreground leading-relaxed">
                  Únete a cientos de personas que ya han comenzado su proceso de
                  transformación con Ainara.
                </motion.p>
                <motion.div
                  variants={fadeUp}
                  className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                >
                  <Button
                    size="lg"
                    className="h-14 px-10 bg-gradient-to-r from-primary to-accent text-primary-foreground text-base hover:opacity-90 shadow-lg shadow-primary/20"
                    onClick={() => setRegisterOpen(true)}
                  >
                    Comenzar mi transformación
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="lg" className="h-14 px-8 text-base" asChild>
                    <Link href="/login">Ya tengo cuenta</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer className="border-t border-border/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-display text-xl font-light">Ainara</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Plataforma de educación para la transformación personal y espiritual.
              </p>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacidad</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Términos</Link>
                <Link href="/login" className="hover:text-primary transition-colors">Acceso</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  )
}
