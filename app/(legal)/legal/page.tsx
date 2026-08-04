import type { Metadata } from "next"
import Link from "next/link"
import { CONTROLLER, LegalDoc, PlaceholderWarning } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Aviso Legal",
  description:
    "Datos identificativos del titular de Mitra y condiciones generales de uso del sitio web.",
}

export default function LegalNoticePage() {
  return (
    <LegalDoc title="Aviso Legal" updatedAt="agosto de 2026">
      <PlaceholderWarning />

      <p>
        En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la
        Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se
        facilitan los siguientes datos identificativos.
      </p>

      <h2>1. Titular del sitio</h2>
      <ul>
        <li><strong>Denominación:</strong> {CONTROLLER.name}</li>
        <li><strong>NIF/CIF:</strong> {CONTROLLER.taxId}</li>
        <li><strong>Domicilio:</strong> {CONTROLLER.address}</li>
        <li><strong>Correo electrónico:</strong> {CONTROLLER.email}</li>
        <li><strong>Sitio web:</strong> {CONTROLLER.site}</li>
        <li><strong>Nombre comercial:</strong> {CONTROLLER.brand}</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>
        Este aviso regula el acceso y uso del sitio web. Navegar por él te
        atribuye la condición de usuario e implica la aceptación de estas
        condiciones. Las condiciones del servicio de suscripción se detallan en
        los <Link href="/terms">Términos y Condiciones</Link>.
      </p>

      <h2>3. Condiciones de uso</h2>
      <p>
        Te comprometes a usar el sitio conforme a la ley, la buena fe y el orden
        público, absteniéndote de:
      </p>
      <ul>
        <li>Realizar actividades ilícitas o lesivas de derechos de terceros.</li>
        <li>
          Intentar acceder a áreas restringidas, alterar el servicio o introducir
          código malicioso.
        </li>
        <li>
          Extraer contenido de forma automatizada, ya sea con robots, arañas o
          herramientas similares.
        </li>
      </ul>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>
        Todos los contenidos del sitio —textos, vídeos, imágenes, marcas, diseño,
        código fuente y estructura— son titularidad de {CONTROLLER.name} o se
        utilizan con la debida licencia. Su reproducción, distribución,
        comunicación pública o transformación sin autorización expresa está
        prohibida.
      </p>

      <h2>5. Exclusión de garantías y responsabilidad</h2>
      <p>
        El titular no garantiza la disponibilidad continua del sitio ni la
        ausencia de errores, y no se responsabiliza de los daños derivados de un
        uso indebido o de fallos ajenos a su control. El contenido publicado
        tiene carácter formativo y no constituye asesoramiento profesional de
        ninguna clase.
      </p>

      <h2>6. Enlaces</h2>
      <p>
        El sitio puede incluir enlaces a páginas de terceros. El titular no
        controla ni responde de sus contenidos ni de sus políticas de privacidad.
      </p>

      <h2>7. Protección de datos</h2>
      <p>
        El tratamiento de datos personales se detalla en la{" "}
        <Link href="/privacy">Política de Privacidad</Link> y el uso de cookies
        en la <Link href="/cookies">Política de Cookies</Link>.
      </p>

      <h2>8. Legislación aplicable</h2>
      <p>
        Este aviso se rige por la legislación española. Para la resolución de
        controversias serán competentes los juzgados y tribunales que
        correspondan conforme a la normativa vigente en materia de consumidores.
      </p>
    </LegalDoc>
  )
}
