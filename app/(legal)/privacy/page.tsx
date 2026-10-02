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
    <LegalDoc title="Política de Privacidad" updatedAt="2 de octubre de 2026">
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
          si decides usar la carta natal. Son opcionales y puedes borrarlos. La fecha, hora, ciudad y carta natal no se muestran en el perfil de comunidad.
        </li>
        <li>
          <strong>Diario de reflexión:</strong> tu estado de ánimo diario y lo que
          escribes. Es <strong>estrictamente privado</strong>: la base de datos
          impide técnicamente que otra persona lo lea, incluido el resto de
          usuarias.
        </li>
        <li>
          <strong>Rueda de la vida:</strong> las puntuaciones que eliges en ocho
          áreas personales, tu prioridad y la intención que escribes. Estas
          evaluaciones son privadas, están asociadas a tu cuenta y se incluyen
          en la exportación de tus datos.
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
          escribes, el historial de esa conversación y el contenido disponible de la clase se envían al proveedor del modelo para generar la respuesta. El asistente puede usar tu nombre y nivel para personalizar el acompañamiento; no recibe tu diario privado, tus mensajes con otras personas ni tus datos de nacimiento.
        </li>
      </ul>
      <p>
        No usamos herramientas de analítica, publicidad ni seguimiento de
        terceros. No elaboramos perfiles comerciales ni vendemos datos a nadie.
      </p>

      <h2 id="testimonios-audiovisuales">3. Testimonios audiovisuales</h2>
      <p>
        Participar es voluntario y no condiciona el acceso al servicio. La
        autorización para un testimonio se solicita mediante una casilla propia,
        sin marcar, y <strong>no se deduce de la aceptación de estas condiciones</strong>.
        Antes de publicar, mostramos y registramos la versión legal aceptada y la fecha.
      </p>
      <table>
        <thead>
          <tr><th>Elemento</th><th>Tratamiento</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Imagen</strong></td><td>Grabación, edición técnica y reproducción de la apariencia de la participante.</td></tr>
          <tr><td><strong>Voz</strong></td><td>Grabación, ajuste técnico y reproducción del audio; no se usa para identificación biométrica.</td></tr>
          <tr><td><strong>Texto testimonial</strong></td><td>Transcripción, subtítulos o extractos fieles, sin alterar el sentido de lo manifestado.</td></tr>
          <tr><td><strong>Metadatos del vídeo</strong></td><td>Nombre del archivo, formato, tamaño, duración, identificador técnico, fecha de subida y datos necesarios para seguridad y entrega. Eliminamos los metadatos no necesarios cuando sea técnicamente posible.</td></tr>
        </tbody>
      </table>
      <ul>
        <li><strong>Finalidad:</strong> revisar, moderar y, solo dentro del alcance elegido, comunicar experiencias reales sobre la formación y el acompañamiento.</li>
        <li><strong>Base jurídica:</strong> consentimiento específico y revocable (art. 6.1.a RGPD). Si el contenido revela salud u otra categoría especial, exigimos además consentimiento explícito (art. 9.2.a) y revisión jurídica previa.</li>
        <li><strong>Audiencia:</strong> la seleccionada al autorizar: revisión interna, personas registradas o web pública y canales sociales propios. No ampliamos canales, campañas ni usos publicitarios sin una nueva autorización.</li>
        <li><strong>Proveedor de alojamiento:</strong> Cloudflare Stream almacena y distribuye el vídeo por cuenta nuestra; Supabase conserva el registro de consentimiento, texto y estado de moderación. Las transferencias internacionales se protegen como se indica en la sección de proveedores.</li>
        <li><strong>Conservación:</strong> mientras el testimonio esté publicado y exista consentimiento. Tras su retirada bloqueamos la publicación y eliminamos vídeo y copias bajo nuestro control en un máximo de 30 días, salvo conservación limitada para atender responsabilidades legales. Las copias de seguridad rotan en sus ciclos técnicos.</li>
        <li><strong>Moderación:</strong> todos los testimonios quedan pendientes de revisión. Podemos rechazarlos o editarlos solo por formato, duración, privacidad, seguridad o cumplimiento; pediremos aprobación si una edición cambia el sentido. No publicamos afirmaciones engañosas ni datos de terceras personas sin base suficiente.</li>
      </ul>
      <h3>Retirar el testimonio y solicitar su eliminación</h3>
      <p>
        Puedes retirar el consentimiento en cualquier momento escribiendo a{" "}
        <a href={`mailto:${CONTROLLER.email}?subject=Retirada%20de%20testimonio`}>
          <strong>{CONTROLLER.email}</strong>
        </a>{" "}
        con el asunto «Retirada de testimonio» e indicando el nombre con el que
        participaste y, si lo conoces, el enlace. Confirmaremos la recepción,
        ocultaremos el contenido con diligencia y tramitaremos su eliminación.
        Retirar el consentimiento no afecta a los tratamientos realizados
        legítimamente antes de recibir la solicitud.
      </p>
      <p>
        Una persona administradora solo puede subir el vídeo de un tercero si ha
        comprobado una autorización escrita, específica e informada que identifique
        a la persona, el contenido, finalidades, audiencia, canales, plazo y forma
        de retirada. Debe guardar evidencia verificable de la fecha, versión del
        texto aceptado, firmante y documento o comunicación, con acceso restringido.
      </p>
      <p>
        <strong>Antes de activar este flujo se solicitará revisión jurídica</strong>,
        especialmente cuando el relato mencione salud mental, diagnósticos,
        tratamientos o resultados personales.
      </p>

      <h2>4. Para qué los usamos y con qué base legal</h2>
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

      <h2>5. Cuánto tiempo los conservamos</h2>
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

      <h2>6. Quién más accede a tus datos</h2>
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
            <td>Google Gemini / Groq</td>
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

      <h2>7. Tus derechos</h2>
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

      <h2>8. Decisiones automatizadas</h2>
      <p>
        No tomamos decisiones automatizadas con efectos jurídicos sobre ti. El
        asistente de IA y la carta natal generan contenido orientativo:{" "}
        <strong>no son diagnósticos ni asesoramiento profesional</strong> y
        ninguna decisión sobre tu cuenta depende de ellos.
      </p>

      <h2>9. Menores de edad</h2>
      <p>
        La plataforma está dirigida a mayores de <strong>14 años</strong>. Por
        debajo de esa edad se requiere autorización de quien ostente la patria
        potestad. Si detectamos una cuenta de un menor sin autorización, la
        eliminaremos.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        Ciframos las comunicaciones (HTTPS), las contraseñas se almacenan con
        funciones de derivación seguras y el acceso a los datos está restringido
        a nivel de base de datos mediante políticas por fila: cada persona solo
        puede leer lo suyo. Si ocurriera una brecha con riesgo para tus derechos,
        te lo notificaríamos y lo comunicaríamos a la autoridad de control en las
        72 horas siguientes.
      </p>

      <h2>11. Cambios en esta política</h2>
      <p>
        Si modificamos esta política de forma sustancial, te avisaremos dentro de
        la plataforma antes de que los cambios sean efectivos.
      </p>
    </LegalDoc>
  )
}
