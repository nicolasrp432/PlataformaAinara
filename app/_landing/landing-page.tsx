"use client"

import { useState, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, Check, Menu, X, Lock, Sparkles, Quote,
  CalendarDays, Infinity as InfinityIcon, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormationsCarousel } from "./formations-carousel"
import { RegisterModal } from "./register-modal"
import { SenderoLogo } from "@/components/ui/logo"
import { MENTOR_PROFILE, MENTOR_EXPERIENCE_LABEL } from "@/lib/mentor"
import {
  PLANS,
  planPrice,
  isPlanPurchasable,
  formatPriceDisplay,
  SINGLE_SESSION_PRICE,
} from "@/lib/pricing"
import {
  TESTIMONIALS,
  SOCIAL_PROOF_STATS,
  PROBLEM_SIGNALS,
  METHOD_PILLARS,
  LIFETIME_INCLUDES,
  MEMBERSHIP_ADDS,
  FAQ,
} from "@/lib/landing-content"

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
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

/** Props de entrada al viewport, repetidas en todas las secciones. */
const inView = {
  variants: stagger,
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, margin: "-60px" },
}

/** Rotulo de seccion: linea + texto en versalitas. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
      <span aria-hidden className="h-px w-8 shrink-0 bg-primary/60" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
        {children}
      </span>
    </motion.div>
  )
}

export function LandingPage({ formations }: LandingPageProps) {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"])

  const lifetime = PLANS.lifetime
  const membership = PLANS.membership
  const lifetimePrice = planPrice(lifetime)
  const membershipPrice = planPrice(membership)
  const membershipOnSale = isPlanPurchasable(membership)

  const openRegister = () => setRegisterOpen(true)

  const navLinks = [
    { href: "#formaciones", label: "Formaciones" },
    { href: "#metodo", label: "Cómo funciona" },
    { href: "#mentora", label: "Quién te acompaña" },
    { href: "#precios", label: "Precio" },
  ]

  return (
    <>
      {/*
        Las secciones de esta pagina entran con framer-motion desde
        `opacity: 0`, y ese estado inicial viaja ya en el HTML del servidor.
        Si el JavaScript no llega a ejecutarse, la portada —la puerta de
        entrada del producto— se quedaria en blanco para siempre. Esta regla
        solo se aplica cuando no hay JS, asi que no interfiere con ninguna
        animacion.
      */}
      <noscript>
        <style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
        {/* ── CABECERA ── */}
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <SenderoLogo className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Mitra
              </span>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex" aria-label="Secciones">
              {navLinks.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button size="sm" onClick={openRegister}>
                Empezar gratis
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/40 lg:hidden"
              >
                <div className="space-y-1 px-4 py-4 sm:px-6">
                  {navLinks.map(({ href, label }) => (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {label}
                    </a>
                  ))}
                  <div className="flex flex-col gap-2 pt-3">
                    <Button variant="outline" asChild>
                      <Link href="/login">Iniciar sesión</Link>
                    </Button>
                    <Button
                      onClick={() => {
                        openRegister()
                        setMobileMenuOpen(false)
                      }}
                    >
                      Empezar gratis
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
            className="relative overflow-x-clip pb-20 pt-16 sm:pt-24 lg:pb-28 lg:pt-28"
          >
            <motion.div
              aria-hidden
              style={{ y: heroY }}
              className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[min(46rem,120%)] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
            />

            <motion.div
              className="mx-auto max-w-4xl px-4 text-center sm:px-6"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Acompañamiento real, no otro curso más
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="font-display text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[4.25rem]"
              >
                Deja de empezar de cero{" "}
                <span className="text-gold-gradient">cada enero</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                Formaciones que sí se terminan y una mentora que conoce tu caso,
                para que el cambio que llevas años posponiendo pase de la lista
                de propósitos a tu semana real.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Button size="lg" className="w-full sm:w-auto" onClick={openRegister}>
                  Ver la primera clase gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <a href="#precios">Ver qué incluye</a>
                </Button>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm text-muted-foreground"
              >
                Sin tarjeta · La primera clase de cada formación es tuya
              </motion.p>

              {/*
                Cifras de prueba social. La lista llega vacia a proposito
                (ver lib/landing-content.ts): sin datos verificables, la
                seccion no se pinta en lugar de inventarse numeros.
              */}
              {SOCIAL_PROOF_STATS.length > 0 && (
                <motion.dl
                  variants={fadeUp}
                  className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-8"
                >
                  {SOCIAL_PROOF_STATS.map(({ value, label }) => (
                    <div key={label} className="min-w-0 text-center">
                      <dt className="sr-only">{label}</dt>
                      <dd>
                        <span className="font-display block text-3xl font-semibold text-foreground">
                          {value}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </motion.dl>
              )}
            </motion.div>
          </section>

          {/* ── TESTIMONIOS ── se oculta solo si no hay ninguno real */}
          {TESTIMONIALS.length > 0 && (
            <section className="border-y border-border/40 bg-muted/20 py-16 lg:py-20">
              <motion.div className="mx-auto max-w-7xl px-4 sm:px-6" {...inView}>
                <SectionLabel>Lo que cuentan</SectionLabel>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {TESTIMONIALS.map((testimonial) => (
                    <motion.figure
                      key={testimonial.name}
                      variants={fadeUp}
                      className="flex min-w-0 flex-col rounded-2xl border border-border/50 bg-card/60 p-6"
                    >
                      <Quote
                        className="mb-3 h-5 w-5 shrink-0 text-primary/50"
                        aria-hidden
                      />
                      <blockquote className="flex-1 text-pretty text-sm leading-relaxed text-foreground">
                        {testimonial.quote}
                      </blockquote>
                      <figcaption className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
                        {testimonial.avatar && (
                          <Image
                            src={testimonial.avatar}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {testimonial.name}
                          </span>
                          {testimonial.context && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {testimonial.context}
                            </span>
                          )}
                        </span>
                      </figcaption>
                    </motion.figure>
                  ))}
                </div>
              </motion.div>
            </section>
          )}

          {/* ── PROBLEMA ── */}
          <section className="py-20 lg:py-28">
            <motion.div className="mx-auto max-w-7xl px-4 sm:px-6" {...inView}>
              <div className="max-w-2xl">
                <SectionLabel>Por qué no funciona</SectionLabel>
                <motion.h2
                  variants={fadeUp}
                  className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl"
                >
                  El problema no es que te falte información
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="mt-4 text-pretty leading-relaxed text-muted-foreground"
                >
                  Información sobra. Lo que falta es alguien que mire tu caso y
                  un sistema que aguante cuando se acaba la motivación.
                </motion.p>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {PROBLEM_SIGNALS.map(({ title, body }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    className="min-w-0 rounded-2xl border border-border/50 bg-card/40 p-6"
                  >
                    <h3 className="text-base font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ── METODO ── */}
          <section id="metodo" className="border-y border-border/40 bg-muted/20 py-20 lg:py-28">
            <motion.div className="mx-auto max-w-7xl px-4 sm:px-6" {...inView}>
              <div className="max-w-2xl">
                <SectionLabel>Cómo funciona</SectionLabel>
                <motion.h2
                  variants={fadeUp}
                  className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl"
                >
                  Tres cosas que lo cambian todo
                </motion.h2>
              </div>

              <ol className="mt-12 grid gap-6 lg:grid-cols-3">
                {METHOD_PILLARS.map(({ step, title, body }) => (
                  <motion.li
                    key={step}
                    variants={fadeUp}
                    className="min-w-0 rounded-2xl border border-border/50 bg-card/60 p-7"
                  >
                    <span
                      aria-hidden
                      className="font-display block text-3xl font-semibold text-primary/40"
                    >
                      {step}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </motion.div>
          </section>

          {/* ── LA MENTORA ── */}
          <section id="mentora" className="py-20 lg:py-28">
            <motion.div className="mx-auto max-w-6xl px-4 sm:px-6" {...inView}>
              <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-14">
                <motion.div
                  variants={fadeUp}
                  className="relative mx-auto w-full max-w-sm lg:max-w-none"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
                    <Image
                      src={MENTOR_PROFILE.portrait}
                      alt={`Retrato de ${MENTOR_PROFILE.name}`}
                      fill
                      sizes="(max-width: 1024px) 80vw, 40vw"
                      className="object-cover object-top"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent"
                    />
                    <span className="absolute bottom-4 left-4 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md">
                      {MENTOR_EXPERIENCE_LABEL}
                    </span>
                  </div>
                </motion.div>

                <div className="min-w-0">
                  <SectionLabel>Quién te acompaña</SectionLabel>
                  <motion.h2
                    variants={fadeUp}
                    className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
                  >
                    {MENTOR_PROFILE.name}, y solo {MENTOR_PROFILE.name}
                  </motion.h2>
                  <motion.p
                    variants={fadeUp}
                    className="mt-4 text-pretty leading-relaxed text-muted-foreground"
                  >
                    {MENTOR_PROFILE.bio}
                  </motion.p>
                  <motion.p
                    variants={fadeUp}
                    className="mt-4 text-pretty leading-relaxed text-muted-foreground"
                  >
                    No hay un equipo rotando ni un becario respondiendo correos.
                    Si reservas una sesión, la sesión es con ella.
                  </motion.p>

                  <motion.ul
                    variants={fadeUp}
                    className="mt-6 flex flex-wrap gap-2"
                  >
                    {MENTOR_PROFILE.specialties.map((s) => (
                      <li
                        key={s}
                        className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                      >
                        {s}
                      </li>
                    ))}
                  </motion.ul>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ── FORMACIONES ── */}
          {formations.length > 0 && (
            <section
              id="formaciones"
              className="border-y border-border/40 bg-muted/20 py-20 lg:py-28"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <motion.div className="mb-10 max-w-2xl" {...inView}>
                  <SectionLabel>El contenido</SectionLabel>
                  <motion.h2
                    variants={fadeUp}
                    className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl"
                  >
                    {formations.length}{" "}
                    {formations.length === 1 ? "formación" : "formaciones"}, y las
                    que vengan
                  </motion.h2>
                  <motion.p
                    variants={fadeUp}
                    className="mt-4 text-pretty leading-relaxed text-muted-foreground"
                  >
                    La primera clase de cada una es gratuita. Entra, míralas y
                    decide después.
                  </motion.p>
                </motion.div>

                <FormationsCarousel formations={formations} />
              </div>
            </section>
          )}

          {/* ── PRECIOS ── */}
          <section id="precios" className="py-20 lg:py-28">
            <motion.div className="mx-auto max-w-6xl px-4 sm:px-6" {...inView}>
              <div className="mx-auto max-w-2xl text-center">
                <motion.div variants={fadeUp} className="mb-4 flex justify-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                    Precio
                  </span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl"
                >
                  Se paga una vez. Es tuyo para siempre.
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="mt-4 text-pretty leading-relaxed text-muted-foreground"
                >
                  Sin cuotas mensuales escondidas. Si además quieres a Ainara a
                  tu lado cada mes, esa parte sí es una suscripción — y la eliges
                  tú.
                </motion.p>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-start">
                {/* Plan principal: el ancla */}
                <motion.div
                  variants={fadeUp}
                  className="relative min-w-0 overflow-hidden rounded-3xl border-2 border-primary/40 bg-card p-7 shadow-xl shadow-primary/5 sm:p-9"
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 gold-gradient"
                  />
                  <div className="flex items-center gap-2">
                    <InfinityIcon className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Acceso permanente
                    </span>
                  </div>

                  <h3 className="font-display mt-4 text-2xl font-semibold text-foreground">
                    {lifetime.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lifetime.tagline}
                  </p>

                  <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                      {lifetimePrice}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {lifetime.billingNote}
                  </p>

                  <Button size="lg" className="mt-7 w-full" onClick={openRegister}>
                    Empezar gratis y decidir después
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Button>
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Pruebas la primera clase de cada formación sin poner tarjeta
                  </p>

                  <ul className="mt-8 space-y-3 border-t border-border/50 pt-7">
                    {LIFETIME_INCLUDES.map(({ title, body }) => (
                      <li key={title} className="flex min-w-0 items-start gap-3">
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15"
                        >
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-pretty text-sm leading-relaxed text-muted-foreground">
                            {body}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Suscripcion: la mejora */}
                <motion.div
                  variants={fadeUp}
                  className="min-w-0 rounded-3xl border border-border/60 bg-card/50 p-7 sm:p-9"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Mejora opcional
                    </span>
                  </div>

                  <h3 className="font-display mt-4 text-2xl font-semibold text-foreground">
                    {membership.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {membership.tagline}
                  </p>

                  {membershipOnSale ? (
                    <>
                      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                          {membershipPrice}
                        </span>
                        <span className="text-sm text-muted-foreground">al mes</span>
                      </p>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {membership.billingNote}
                      </p>
                      {/*
                        Comparacion con el precio real de una sesion suelta.
                        Los dos numeros salen del codigo, no de una promesa.
                      */}
                      <p className="mt-3 text-pretty text-sm leading-relaxed text-foreground">
                        Una sesión suelta con Ainara cuesta{" "}
                        <span className="font-semibold">
                          {formatPriceDisplay(SINGLE_SESSION_PRICE)}
                        </span>
                        . La cuota se cubre con menos de media.
                      </p>
                    </>
                  ) : (
                    /*
                      Sin importe confirmado no se publica ninguna cifra: un
                      precio inventado es un compromiso comercial, no un texto
                      de relleno. La tarjeta vende igual y recoge interes.
                    */
                    <p className="mt-6 text-pretty text-sm leading-relaxed text-muted-foreground">
                      Estamos afinando las plazas y el precio. Deja tu cuenta
                      creada y te avisamos en cuanto abra.
                    </p>
                  )}

                  <Button
                    size="lg"
                    variant="outline"
                    className="mt-7 w-full"
                    onClick={openRegister}
                  >
                    {membershipOnSale ? "Quiero el acompañamiento" : "Avísame cuando abra"}
                  </Button>

                  <p className="mt-8 border-t border-border/50 pt-7 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Todo lo del acceso permanente, y además
                  </p>
                  <ul className="mt-4 space-y-3">
                    {MEMBERSHIP_ADDS.map(({ title, body }) => (
                      <li key={title} className="flex min-w-0 items-start gap-3">
                        <span
                          aria-hidden
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15"
                        >
                          <Sparkles className="h-3 w-3 text-primary" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-pretty text-sm leading-relaxed text-muted-foreground">
                            {body}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Reversion de riesgo, junto al precio y no escondida */}
              <motion.div
                variants={fadeUp}
                className="mx-auto mt-10 flex max-w-2xl items-start gap-3.5 rounded-2xl border border-primary/20 bg-primary/5 p-5"
              >
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <p className="min-w-0 text-pretty text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    No hace falta que te fíes.
                  </span>{" "}
                  Crea la cuenta gratis y mira la primera clase de cada formación
                  entera, sin tarjeta y sin límite de tiempo. Decide cuando
                  tengas criterio, no cuando te lo prometan.
                </p>
              </motion.div>
            </motion.div>
          </section>

          {/* ── FAQ ── */}
          <section className="border-t border-border/40 bg-muted/20 py-20 lg:py-28">
            <motion.div className="mx-auto max-w-3xl px-4 sm:px-6" {...inView}>
              <div className="mb-10">
                <SectionLabel>Dudas frecuentes</SectionLabel>
                <motion.h2
                  variants={fadeUp}
                  className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl"
                >
                  Lo que suelen preguntar antes de entrar
                </motion.h2>
              </div>

              <motion.div variants={fadeUp} className="space-y-3">
                {FAQ.map(({ q, a }, i) => {
                  const isOpen = openFaq === i
                  return (
                    <div
                      key={q}
                      className="overflow-hidden rounded-2xl border border-border/50 bg-card/60"
                    >
                      <h3>
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                        >
                          <span className="min-w-0 text-pretty text-sm font-semibold text-foreground sm:text-base">
                            {q}
                          </span>
                          <ChevronDown
                            aria-hidden
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-pretty px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                              {a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </motion.div>
            </motion.div>
          </section>

          {/* ── CIERRE ── */}
          <section className="py-20 lg:py-28">
            <motion.div
              className="mx-auto max-w-2xl px-4 text-center sm:px-6"
              {...inView}
            >
              <motion.h2
                variants={fadeUp}
                className="font-display text-balance text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl"
              >
                La primera clase no te cuesta nada
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-muted-foreground"
              >
                Ni tarjeta, ni compromiso, ni lista de espera. Creas la cuenta y
                estás dentro en menos de un minuto.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8">
                <Button size="lg" className="w-full sm:w-auto" onClick={openRegister}>
                  Crear mi cuenta gratis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </motion.div>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm text-muted-foreground"
              >
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Inicia sesión
                </Link>
              </motion.p>
            </motion.div>
          </section>
        </main>

        {/* ── PIE ── */}
        <footer className="border-t border-border/40 py-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <SenderoLogo className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                Mitra
              </span>
            </div>
            <nav
              aria-label="Enlaces legales"
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              <Link href="/legal" className="transition-colors hover:text-primary">
                Aviso legal
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-primary">
                Privacidad
              </Link>
              <Link href="/cookies" className="transition-colors hover:text-primary">
                Cookies
              </Link>
              <Link href="/terms" className="transition-colors hover:text-primary">
                Términos
              </Link>
              <Link href="/login" className="transition-colors hover:text-primary">
                Acceso
              </Link>
            </nav>
          </div>
        </footer>
      </div>

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  )
}
