import type { Metadata } from "next"
import Link from "next/link"
import { CONTROLLER, LegalDoc } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo Mitra recoge, usa y protege tus datos personales, y cómo puedes ejercer tus derechos.",
}

export default function PrivacyPage() {
  return (
    <LegalDoc title="Política de Privacidad" updatedAt="agosto de 2026">
      <p>
        En {CONTROLLER.brand} tratamos datos muy personales: lo que escribes en tu
        diario privado, cómo te sientes cada día y tus conversaciones con otras
        personas de la comunidad. Esta política explica, sin rodeos, qué hacemos
        con ellos y qué puedes exigirnos.
      </p>

      <h2>1. Quién es el responsable</h2>
      <ul>
        <li><strong>Responsable:</strong> {CONTROLLER.name}</li>
        <li><strong>NIF/CIF:</strong> {CONTROLLER.taxId}</li>
        <li><strong>Domicilio:</strong> {CONTROLLER.address}</li>
        <li><strong>Contacto de privacidad:</strong> {CONTROLLER.email}</li>
        <li><strong>Sitio web:</strong> {CONTROLLER.site}</li>
      </ul>

      <h2>2. Qué datos tratamos</h2>
      <p>Solo tratamos datos que tú nos das o que se generan al usar la plataforma:</p>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, dirección de correo electrónico y
          contraseña (que se guarda cifrada; nunca la vemos en claro).
        </li>
        <li>
          <strong>Perfil:</strong> avatar, biografía, preferencias de visibilidad
          y de mensajería.
        </li>
        <li>
          <strong>Datos de nacimiento:</strong> fecha, hora y ciudad, únicamente
          si decides usar la carta natal. Son opcionales y puedes borrarlos.
        </li>
        <li>
          <strong>Diario de reflexión:</strong> tu estado de ánimo diario y lo que
          escribes. Es <strong>estrictamente privado</strong>: la base de datos
          impide técnicamente que otra persona lo lea, incluido el resto de
          usuarias.
        </li>
        <li>
          <strong>Actividad formativa:</strong> lecciones vistas, progreso, XP,
          nivel, racha, insignias y resultados de cuestionarios.
        </li>
        <li>
          <strong>Contenido que publicas:</strong> reflexiones públicas en la
          comunidad, comentarios y mensajes directos.
        </li>
        <li>
          <strong>Pagos:</strong> gestionados íntegramente por Stripe. Nosotros
          conservamos el estado de tu suscripción y un identificador de cliente,{" "}
          <strong>nunca el número de tu tarjeta</strong>.
        </li>
        <li>
          <strong>Consultas al asistente de IA:</strong> los mensajes que le
          escribes se envían al proveedor del modelo para generar la respuesta.
        </li>
      </ul>
      <p>
        No usamos herramientas de analítica, publicidad ni seguimiento de
        terceros. No elaboramos perfiles comerciales ni vendemos datos a nadie.
      </p>

      <h2>3. Para qué los usamos y con qué base legal</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base jurídica (RGPD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Crear y mantener tu cuenta y darte acceso al contenido</td>
            <td>Ejecución del contrato (art. 6.1.b)</td>
          </tr>
          <tr>
            <td>Cobrar la suscripción y emitir facturas</td>
            <td>Contrato y obligación legal (art. 6.1.b y 6.1.c)</td>
          </tr>
          <tr>
            <td>Guardar tu progreso, diario y carta natal</td>
            <td>Ejecución del contrato (art. 6.1.b)</td>
          </tr>
          <tr>
            <td>Comunidad, comentarios y mensajería entre usuarias</td>
            <td>Ejecución del contrato (art. 6.1.b)</td>
          </tr>
          <tr>
            <td>Notificaciones del servicio y frase diaria</td>
            <td>Interés legítimo en un servicio útil (art. 6.1.f)</td>
          </tr>
          <tr>
            <td>Seguridad, prevención de abusos y moderación</td>
            <td>Interés legítimo (art. 6.1.f)</td>
          </tr>
          <tr>
            <td>Asistente de IA</td>
            <td>Ejecución del contrato, a petición tuya (art. 6.1.b)</td>
          </tr>
          <tr>
            <td>Comunicaciones comerciales, si las aceptas</td>
            <td>Consentimiento, revocable (art. 6.1.a)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Cuánto tiempo los conservamos</h2>
      <ul>
        <li>
          <strong>Mientras tengas la cuenta activa.</strong> Si solicitas la
          baja, eliminamos o anonimizamos tus datos en un plazo máximo de{" "}
          <strong>30 días</strong>.
        </li>
        <li>
          <strong>Facturación:</strong> los datos fiscales se conservan{" "}
          <strong>6 años</strong> por obligación legal (Código de Comercio y
          normativa tributaria), aunque cierres la cuenta.
        </li>
        <li>
          <strong>Contenido público</strong> que hayas publicado en la comunidad:
          se elimina o se disocia de tu identidad al darte de baja.
        </li>
      </ul>

      <h2>5. Quién más accede a tus datos</h2>
      <p>
        Solo proveedores necesarios para que la plataforma funcione, todos con
        contrato de encargado de tratamiento:
      </p>
      <table>
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Para qué</th>
            <th>Ubicación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Base de datos, autenticación y almacenamiento de archivos</td>
            <td>UE / EE. UU.</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Alojamiento y entrega de la web</td>
            <td>UE / EE. UU.</td>
          </tr>
          <tr>
            <td>Stripe</td>
            <td>Procesamiento de pagos y suscripciones</td>
            <td>UE / EE. UU.</td>
          </tr>
          <tr>
            <td>Groq</td>
            <td>Modelo de lenguaje del asistente de IA</td>
            <td>EE. UU.</td>
          </tr>
          <tr>
            <td>YouTube (Google)</td>
            <td>Reproducción de los vídeos de las lecciones</td>
            <td>EE. UU.</td>
          </tr>
          <tr>
            <td>Cloudflare</td>
            <td>Almacenamiento y distribución de vídeo propio</td>
            <td>Global</td>
          </tr>
        </tbody>
      </table>
      <p>
        Las transferencias fuera del Espacio Económico Europeo se amparan en las{" "}
        <strong>Cláusulas Contractuales Tipo</strong> aprobadas por la Comisión
        Europea y, cuando procede, en el Marco de Privacidad de Datos UE-EE. UU.
      </p>
      <p>
        Las tipografías se sirven desde nuestro propio dominio, así que{" "}
        <strong>tu navegador no se conecta a Google Fonts</strong> al visitar la
        plataforma.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento los derechos de{" "}
        <strong>acceso, rectificación, supresión, oposición, limitación y
        portabilidad</strong>, y retirar el consentimiento que hubieras dado.
      </p>
      <p>Dos de ellos están automatizados dentro de la plataforma:</p>
      <ul>
        <li>
          <strong>Portabilidad y acceso:</strong> desde{" "}
          <Link href="/profile/settings">Configuración</Link> puedes descargar un
          archivo con todos tus datos.
        </li>
        <li>
          <strong>Supresión:</strong> desde esa misma página puedes solicitar la
          eliminación de tu cuenta.
        </li>
      </ul>
      <p>
        Para el resto, escribe a <strong>{CONTROLLER.email}</strong>. Responderemos
        en un plazo máximo de un mes. Si crees que no hemos atendido bien tu
        solicitud, puedes reclamar ante la{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>

      <h2>7. Decisiones automatizadas</h2>
      <p>
        No tomamos decisiones automatizadas con efectos jurídicos sobre ti. El
        asistente de IA y la carta natal generan contenido orientativo:{" "}
        <strong>no son diagnósticos ni asesoramiento profesional</strong> y
        ninguna decisión sobre tu cuenta depende de ellos.
      </p>

      <h2>8. Menores de edad</h2>
      <p>
        La plataforma está dirigida a mayores de <strong>14 años</strong>. Por
        debajo de esa edad se requiere autorización de quien ostente la patria
        potestad. Si detectamos una cuenta de un menor sin autorización, la
        eliminaremos.
      </p>

      <h2>9. Seguridad</h2>
      <p>
        Ciframos las comunicaciones (HTTPS), las contraseñas se almacenan con
        funciones de derivación seguras y el acceso a los datos está restringido
        a nivel de base de datos mediante políticas por fila: cada persona solo
        puede leer lo suyo. Si ocurriera una brecha con riesgo para tus derechos,
        te lo notificaríamos y lo comunicaríamos a la autoridad de control en las
        72 horas siguientes.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Si modificamos esta política de forma sustancial, te avisaremos dentro de
        la plataforma antes de que los cambios sean efectivos.
      </p>
    </LegalDoc>
  )
}
