import type { Metadata } from "next"
import Link from "next/link"
import { CONTROLLER, LegalDoc, PlaceholderWarning } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Condiciones de uso de Mitra: cuenta, suscripción, pagos, contenido y normas de la comunidad.",
}

export default function TermsPage() {
  return (
    <LegalDoc title="Términos y Condiciones" updatedAt="agosto de 2026">
      <PlaceholderWarning />

      <p>
        Estas condiciones regulan el uso de {CONTROLLER.brand} (
        {CONTROLLER.site}), titularidad de {CONTROLLER.name}. Al crear una cuenta
        aceptas lo que sigue, así que merece la pena leerlo.
      </p>

      <h2>1. Qué es esta plataforma</h2>
      <p>
        {CONTROLLER.brand} es una plataforma de formación y acompañamiento en
        desarrollo personal: formaciones en vídeo, ejercicios, un diario de
        reflexión privado, una comunidad y sesiones de mentoría.
      </p>

      <h2>2. Naturaleza del servicio — importante</h2>
      <p>
        El contenido tiene finalidad <strong>formativa y de crecimiento
        personal</strong>. <strong>No es asistencia sanitaria, psicológica,
        terapéutica, jurídica ni financiera</strong>, y no sustituye el criterio
        de un profesional colegiado.
      </p>
      <p>
        Si atraviesas una crisis o tienes un problema de salud mental, acude a un
        profesional sanitario. En España, el teléfono de atención a la conducta
        suicida es el <strong>024</strong> y las urgencias, el{" "}
        <strong>112</strong>.
      </p>
      <p>
        Los contenidos sobre arquetipos, carta natal y leyes universales se
        ofrecen como <strong>herramientas simbólicas de autoconocimiento</strong>,
        sin pretensión de validez científica ni capacidad predictiva.
      </p>

      <h2>3. Cuenta</h2>
      <ul>
        <li>Debes tener al menos 14 años, o autorización de tus tutores legales.</li>
        <li>Los datos que facilites deben ser veraces y estar actualizados.</li>
        <li>
          La cuenta es <strong>personal e intransferible</strong>: no puedes
          compartir tus credenciales ni el acceso al contenido.
        </li>
        <li>
          Eres responsable de lo que ocurra bajo tu cuenta. Avísanos si detectas
          un uso no autorizado.
        </li>
      </ul>

      <h2>4. Suscripción, precios y pagos</h2>
      <ul>
        <li>
          Parte del contenido es gratuito; el acceso completo requiere una
          suscripción de pago.
        </li>
        <li>
          Los pagos se procesan a través de <strong>Stripe</strong>. No
          almacenamos los datos de tu tarjeta.
        </li>
        <li>
          Los precios se muestran con los impuestos aplicables antes de
          confirmar la compra.
        </li>
        <li>
          Salvo indicación distinta, la suscripción se <strong>renueva
          automáticamente</strong> por periodos iguales.
        </li>
        <li>
          Puedes <strong>cancelar cuando quieras</strong> desde{" "}
          <Link href="/billing">Suscripción</Link>. La cancelación surte efecto
          al final del periodo ya pagado, sin penalización y sin devolución
          proporcional del periodo en curso.
        </li>
        <li>
          Podemos actualizar los precios avisando con al menos 30 días de
          antelación; si no estás de acuerdo, puedes cancelar antes de que se
          apliquen.
        </li>
      </ul>

      <h2>5. Derecho de desistimiento</h2>
      <p>
        Como consumidor tienes <strong>14 días naturales</strong> para desistir
        del contrato sin justificación, escribiendo a {CONTROLLER.email}.
      </p>
      <p>
        <strong>Excepción legal:</strong> al tratarse de contenido digital de
        acceso inmediato, si solicitas empezar a usarlo durante ese plazo y
        aceptas expresamente que pierdes el derecho de desistimiento una vez
        comenzada la ejecución, <strong>este decae</strong> (art. 103.m del texto
        refundido de la Ley General para la Defensa de los Consumidores y
        Usuarios). Si no has accedido a ningún contenido de pago, te devolvemos
        el importe íntegro.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        Los vídeos, textos, ejercicios, materiales descargables, marca y diseño
        son propiedad de {CONTROLLER.name} o se usan con licencia. Al suscribirte
        obtienes una <strong>licencia personal, limitada, revocable y no
        transferible</strong> para consumirlos dentro de la plataforma.
      </p>
      <p>Queda expresamente prohibido:</p>
      <ul>
        <li>Descargar, grabar, copiar o redistribuir el contenido.</li>
        <li>Compartir tus credenciales o revender el acceso.</li>
        <li>Usar el contenido con fines comerciales o formativos propios.</li>
      </ul>
      <p>
        Lo que <strong>tú</strong> publicas sigue siendo tuyo. Al publicarlo en la
        comunidad nos concedes una licencia no exclusiva para mostrarlo dentro de
        la plataforma, que termina cuando lo borras.
      </p>

      <h2>7. Normas de convivencia</h2>
      <p>La comunidad y la mensajería existen para acompañarse. No se permite:</p>
      <ul>
        <li>Acoso, insultos, discriminación o incitación al odio.</li>
        <li>Difundir contenido de terceros sin permiso o datos privados ajenos.</li>
        <li>Spam, promoción no autorizada o captación de clientes.</li>
        <li>Suplantar a otras personas.</li>
        <li>Ofrecer consejo sanitario o terapéutico haciéndose pasar por profesional.</li>
      </ul>
      <p>
        Podemos retirar contenido y suspender cuentas que incumplan estas normas.
        Puedes limitar quién te escribe desde{" "}
        <Link href="/profile/settings">Configuración</Link>.
      </p>

      <h2>8. Mentoría</h2>
      <p>
        Las sesiones se reservan y pagan por separado. Las cancelaciones con menos
        de 24 horas de antelación pueden no ser reembolsables. La mentoría es
        acompañamiento formativo, no terapia.
      </p>

      <h2>9. Disponibilidad</h2>
      <p>
        Trabajamos para mantener el servicio disponible, pero no garantizamos
        funcionamiento ininterrumpido: puede haber mantenimientos, incidencias de
        terceros o cambios en el contenido. Avisaremos de las paradas
        programadas cuando sea posible.
      </p>

      <h2>10. Responsabilidad</h2>
      <p>
        Respondemos de los daños directos que se deriven de un incumplimiento
        nuestro. No respondemos del uso que hagas de los contenidos ni de las
        decisiones personales, profesionales o de salud que tomes a partir de
        ellos. Nada de lo aquí dicho limita los derechos que la ley te reconoce
        como consumidor.
      </p>

      <h2>11. Suspensión y baja</h2>
      <p>
        Puedes darte de baja cuando quieras desde{" "}
        <Link href="/profile/settings">Configuración</Link>. Podemos suspender o
        cerrar cuentas que incumplan gravemente estas condiciones, informando del
        motivo salvo que la ley lo impida.
      </p>

      <h2>12. Ley aplicable y reclamaciones</h2>
      <p>
        Estas condiciones se rigen por la <strong>legislación española</strong>.
        Para cualquier controversia, si eres consumidor podrás acudir a los
        juzgados de tu domicilio. También puedes usar la{" "}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          plataforma europea de resolución de litigios en línea
        </a>
        .
      </p>
      <p>
        Consulta también nuestra{" "}
        <Link href="/privacy">Política de Privacidad</Link> y la{" "}
        <Link href="/cookies">Política de Cookies</Link>.
      </p>
    </LegalDoc>
  )
}
