import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Sparkles,
  Compass,
  BookOpen,
  NotebookPen,
  Users,
  LockKeyhole,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/ui/brand";
import { MediaImage } from "@/components/media/media-image";
import { MENTOR_PROFILE, MENTOR_EXPERIENCE_LABEL } from "@/lib/mentor";
import { PLANS, planPrice } from "@/lib/pricing";
import {
  TESTIMONIALS,
  LIFETIME_INCLUDES,
  MEMBERSHIP_ADDS,
  FAQ,
} from "@/lib/landing-content";
import { SignupProvider, SignupButton } from "./signup-provider";
import { ExperiencePreview } from "./experience-preview";
import { Reveal } from "./landing-motion";
import { HeroVisual } from "./hero-visual";

interface Formation {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  is_premium: boolean | null;
  xp_reward: number | null;
}
const navigation = [
  { href: "#dentro", label: "La plataforma" },
  { href: "#formaciones", label: "Formaciones" },
  { href: "#mentora", label: "Ainara" },
  { href: "#precios", label: "Accesos y precios" },
];
function Label({ children }: { children: React.ReactNode }) {
  return <p className="ainara-eyebrow">{children}</p>;
}

/** Public sales content stays on the server; only tabs, ranges and registration hydrate. */
export function LandingPage({ formations }: { formations: Formation[] }) {
  const lifetimePrice = planPrice(PLANS.lifetime);
  const membershipPrice = planPrice(PLANS.membership);
  return (
    <SignupProvider>
      <div className="ainara-landing sales-landing">
        <header className="sales-header">
          <div className="sales-container flex h-20 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <BrandLockup size="md" />
            </Link>
            <nav
              aria-label="Secciones"
              className="sales-nav hidden text-sm lg:flex"
            >
              {navigation.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden text-sm font-medium sm:inline"
              >
                Acceder
              </Link>
              <SignupButton size="sm" className="hidden sm:flex">
                Empezar gratis
              </SignupButton>
              <details className="sales-mobile-menu lg:hidden">
                <summary aria-label="Menú de navegación">
                  <Menu size={22} />
                </summary>
                <nav aria-label="Secciones móviles">
                  {navigation.map((item) => (
                    <a key={item.href} href={item.href}>
                      {item.label}
                    </a>
                  ))}
                  <Link href="/login">Acceder a mi cuenta</Link>
                </nav>
              </details>
            </div>
          </div>
        </header>
        <main>
          <section className="ainara-hero">
            <Reveal className="ainara-hero-copy">
              <Label>MITRA / DESDE LA RAÍZ</Label>
              <h1>
                El cambio empieza
                <br />
                <em>por volver a ti.</em>
              </h1>
              <p className="ainara-hero-description">
                Formaciones, herramientas de autoconocimiento y acompañamiento
                con Ainara. Un espacio para entender dónde estás y dar el
                siguiente paso con intención.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <SignupButton>Explorar mi primera clase</SignupButton>
                <Button variant="outline" size="lg" asChild>
                  <a href="#dentro">Descubrir la plataforma</a>
                </Button>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Primera clase de cada formación gratis · Sin tarjeta
              </p>
              <div className="ainara-hero-index">
                <span>Aprende a tu ritmo</span>
                <span>Escucha tu momento</span>
                <span>Integra en tu vida</span>
              </div>
            </Reveal>
            <HeroVisual />
          </section>
          <div className="sales-trust-strip">
            <div className="sales-container grid gap-5 sm:grid-cols-3">
              <span>
                <BookOpen size={18} /> Formaciones con práctica
              </span>
              <span>
                <LockKeyhole size={18} /> Diario y evaluaciones privados
              </span>
              <span>
                <Users size={18} /> Mentoría y comunidad
              </span>
            </div>
          </div>
          <section className="sales-section sales-container">
            <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
              <div>
                <Label>CUANDO SABES QUE NECESITAS ALGO DISTINTO</Label>
                <h2 className="sales-title">
                  No siempre falta voluntad.
                  <br />
                  <em>A veces falta un camino.</em>
                </h2>
                <p className="mt-5 max-w-lg text-muted-foreground">
                  Mitra te ayuda a poner atención en lo que importa, hacer
                  espacio para aprender y convertir esa mirada en pasos
                  posibles.
                </p>
              </div>
              <div className="sales-recognition">
                {[
                  {
                    title: "Quieres cambiar, pero no sabes por dónde empezar.",
                    body: "Observa tu momento presente y elige una prioridad.",
                  },
                  {
                    title:
                      "Has aprendido mucho y quieres llevarlo a la práctica.",
                    body: "Une formación, ejercicios y reflexión en un mismo espacio.",
                  },
                  {
                    title: "Te gustaría contar con una mirada cercana.",
                    body: "Encuentra comunidad y elige el acompañamiento que necesitas.",
                  },
                ].map((item, index) => (
                  <div key={item.title}>
                    <span className="font-display text-2xl">0{index + 1}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section id="dentro" className="sales-section sales-soft">
            <div className="sales-container">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <Label>DENTRO DE MITRA</Label>
                  <h2 className="sales-title">
                    Más que mirar una clase.
                    <br />
                    <em>Un espacio para integrarla.</em>
                  </h2>
                </div>
                <p className="max-w-sm text-muted-foreground">
                  Explora el diario, prueba la rueda de la vida y consulta tu
                  carta natal como herramientas complementarias para observar
                  patrones, prioridades y preguntas personales.
                </p>
              </div>
              <ExperiencePreview />
              <div className="sales-features">
                {[
                  {
                    icon: BookOpen,
                    title: "Formaciones",
                    body: "Contenido y ejercicios para avanzar a tu ritmo.",
                  },
                  {
                    icon: NotebookPen,
                    title: "Diario de reflexión",
                    body: "Clima emocional, preguntas guía e historial privado.",
                  },
                  {
                    icon: Compass,
                    title: "Rueda de la vida",
                    body: "Ocho áreas, una intención y perspectiva sobre tu evolución.",
                  },
                  {
                    icon: Sparkles,
                    title: "Carta natal",
                    body: "Un mapa astrológico calculado con tu fecha, hora y lugar de nacimiento para explorar símbolos y preguntas sobre ti. Se plantea como reflexión personal, no como diagnóstico ni predicción.",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <item.icon size={22} />
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section id="formaciones" className="sales-section sales-container">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
              <div>
                <Label>TU APRENDIZAJE</Label>
                <h2 className="sales-title">Encuentra tu punto de partida.</h2>
              </div>
              <p className="max-w-md text-muted-foreground">
                Prueba la primera clase de cada formación. Decide después si
                quieres continuar.
              </p>
            </div>
            {formations.length > 0 ? (
              <div className="sales-course-grid">
                {formations.map((formation) => (
                  <Link
                    key={formation.id}
                    href={`/formations/${formation.slug}`}
                    className="sales-course"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <MediaImage
                        src={formation.thumbnail_url}
                        alt={formation.title}
                        seed={formation.slug}
                        fill
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <span className="ainara-eyebrow">
                        PRIMERA CLASE GRATUITA
                      </span>
                      <h3 className="font-display text-2xl">
                        {formation.title}
                      </h3>
                      {formation.description && (
                        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                          {formation.description}
                        </p>
                      )}
                      <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-4 text-sm">
                        {formation.duration_minutes ? (
                          <span>{formation.duration_minutes} min</span>
                        ) : null}
                        <span className="font-semibold text-primary-strong">
                          Ver la formación
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="sales-catalog-empty">
                <BookOpen size={32} />
                <h3 className="font-display text-2xl">
                  El catálogo te espera dentro.
                </h3>
                <p>
                  Crea tu cuenta para consultar las formaciones disponibles y
                  probar sus primeras clases.
                </p>
                <SignupButton>Explorar las formaciones</SignupButton>
              </div>
            )}
          </section>
          <section id="mentora" className="sales-section sales-dark">
            <div className="sales-container grid items-center gap-12 lg:grid-cols-[.85fr_.7fr_1fr]">
              <Reveal className="mentor-frame">
                <div className="mentor-frame-image"><Image src={MENTOR_PROFILE.portrait} alt="Ainara Unamunzaga, fundadora y mentora de Mitra" fill sizes="(max-width: 1023px) 100vw, 42vw" className="object-cover" /></div>
                <div className="mentor-frame-note"><Sparkles size={18}/><span>Presencia, escucha y dirección</span></div>
              </Reveal>
              <div>
                <Label>QUIÉN TE ACOMPAÑA</Label>
                <h2 className="sales-title">
                  Una persona.
                  <br />
                  <em>Tu proceso.</em>
                </h2>
                <p className="mt-5 text-lg">{MENTOR_PROFILE.tagline}</p>
                <p className="mt-5 text-sm opacity-80">{MENTOR_PROFILE.bio}</p>
                <span className="mt-6 inline-block rounded-full border border-white/20 px-4 py-2 text-sm">
                  {MENTOR_EXPERIENCE_LABEL}
                </span>
              </div>
              <div className="sales-mentor-steps">
                {MENTOR_PROFILE.approach.map((step, index) => (
                  <div key={step.title}>
                    <span className="font-display text-3xl">0{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-5 text-sm opacity-75">
                  La mentoría está incluida con el acompañamiento mensual. Con
                  acceso permanente puedes reservar sesiones por separado.
                </p>
              </div>
            </div>
          </section>
          {TESTIMONIALS.length > 0 && (
            <section className="sales-section sales-container">
              <Label>EXPERIENCIAS COMPARTIDAS</Label>
              <h2 className="sales-title mb-8">
                Lo que cuentan quienes han estado aquí.
              </h2>
              <div className="grid gap-5 md:grid-cols-3">
                {TESTIMONIALS.map((testimonial) => (
                  <figure key={testimonial.name} className="ainara-panel">
                    <blockquote>{testimonial.quote}</blockquote>
                    <figcaption className="mt-5 border-t pt-4">
                      <strong>{testimonial.name}</strong>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.context}
                      </p>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
          <section id="precios" className="sales-section sales-container">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <Label>ELIGE CÓMO QUIERES AVANZAR</Label>
              <h2 className="sales-title">
                Un acceso claro.
                <br />
                <em>Una decisión tuya.</em>
              </h2>
              <p className="mt-5 text-muted-foreground">
                Empieza gratis. Si quieres continuar, elige acceso permanente o
                acompañamiento mensual. No necesitas contratar ambos.
              </p>
            </div>
            <div className="sales-pricing">
              <article className="sales-price-card sales-price-free">
                <span className="ainara-eyebrow">PARA CONOCERNOS</span>
                <h3 className="font-display text-2xl">Tu primer paso</h3>
                <p className="sales-price">Gratis</p>
                <p className="text-sm text-muted-foreground">
                  Sin tarjeta ni compromiso.
                </p>
                <SignupButton variant="outline" className="mt-6 w-full">
                  Crear mi cuenta
                </SignupButton>
                <ul>
                  {[
                    "Primera clase de cada formación",
                    "Diario privado de reflexión",
                    "Rueda de la vida y perfil personal",
                  ].map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="sales-price-card sales-price-featured">
                <span className="ainara-eyebrow">PARA AVANZAR A TU RITMO</span>
                <h3 className="font-display text-2xl">{PLANS.lifetime.name}</h3>
                <p className="sales-price">{lifetimePrice}</p>
                <p className="text-sm text-muted-foreground">
                  {PLANS.lifetime.billingNote}
                </p>
                <SignupButton className="mt-6 w-full">
                  Probar antes de elegir
                </SignupButton>
                <ul>
                  {LIFETIME_INCLUDES.map((item) => (
                    <li key={item.title}>
                      <Check size={16} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.body}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
                  Mentoría individual disponible con pago por sesión.
                </p>
              </article>
              <article className="sales-price-card">
                <span className="ainara-eyebrow">PARA HACERLO ACOMPAÑADO</span>
                <h3 className="font-display text-2xl">
                  {PLANS.membership.name}
                </h3>
                <p className="sales-price">
                  {membershipPrice}
                  <span>/mes</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {PLANS.membership.billingNote}
                </p>
                <SignupButton variant="outline" className="mt-6 w-full">
                  Conocer el acompañamiento
                </SignupButton>
                <p className="mt-6 text-sm font-semibold">
                  Acceso completo mientras tu suscripción esté activa, además
                  de:
                </p>
                <ul>
                  {MEMBERSHIP_ADDS.map((item) => (
                    <li key={item.title}>
                      <Check size={16} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.body}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
                  Si además tienes acceso permanente, lo conservas al cancelar
                  la suscripción.
                </p>
              </article>
            </div>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
              El pago se realiza dentro de tu cuenta a través de Stripe.
              Consulta las{" "}
              <Link href="/terms" className="underline">
                condiciones de compra y acceso
              </Link>{" "}
              antes de elegir.
            </p>
          </section>
          <section className="sales-section sales-soft">
            <div className="sales-container grid gap-10 lg:grid-cols-[.7fr_1fr]">
              <div>
                <Label>ANTES DE DECIDIR</Label>
                <h2 className="sales-title">
                  Tus preguntas
                  <br />
                  <em>tienen espacio.</em>
                </h2>
                <p className="mt-5 text-muted-foreground">
                  Información sobre el acceso, los pagos y qué puedes esperar de
                  Mitra.
                </p>
              </div>
              <div className="sales-faq">
                {FAQ.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
          <section className="sales-section sales-container">
            <div className="sales-final">
              <Label>UN PRIMER PASO, SIN PRISA</Label>
              <h2 className="sales-title">
                Empieza por una clase.
                <br />
                <em>Escucha qué te mueve.</em>
              </h2>
              <p>
                Entra, conoce la experiencia y decide si este espacio encaja con
                lo que necesitas ahora.
              </p>
              <SignupButton>Explorar mi primera clase</SignupButton>
              <p className="text-sm">
                Sin tarjeta · Sin compromiso · A tu ritmo
              </p>
              <Link href="/login" className="text-sm underline">
                Ya tengo cuenta
              </Link>
            </div>
          </section>
        </main>
        <footer className="sales-footer">
          <div className="sales-container flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="font-display text-2xl">Mitra</p>
              <p className="mt-2 text-sm opacity-70">
                Desde la raíz. Con Ainara.
              </p>
            </div>
            <nav
              aria-label="Enlaces legales"
              className="flex flex-wrap gap-5 text-sm"
            >
              {[
                { href: "/legal", label: "Aviso legal" },
                { href: "/privacy", label: "Privacidad" },
                { href: "/cookies", label: "Cookies" },
                { href: "/terms", label: "Términos" },
                { href: "/login", label: "Acceso" },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </SignupProvider>
  );
}
