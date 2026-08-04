import type { Metadata } from "next"
import Link from "next/link"
import { CONTROLLER, LegalDoc } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Qué cookies usa Mitra, para qué sirven y cómo puedes controlarlas.",
}

export default function CookiesPage() {
  return (
    <LegalDoc title="Política de Cookies" updatedAt="agosto de 2026">
      <p>
        {CONTROLLER.brand} usa las cookies mínimas para funcionar.{" "}
        <strong>No utilizamos cookies de analítica, publicidad ni
        seguimiento</strong>, ni propias ni de terceros. No hay Google Analytics,
        ni píxeles de redes sociales, ni mapas de calor.
      </p>

      <h2>1. Cookies que usamos</h2>
      <p>
        Todas son <strong>técnicas o estrictamente necesarias</strong>, exentas
        del deber de consentimiento previo según el artículo 22.2 de la LSSI-CE.
      </p>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Para qué sirve</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sb-*-auth-token</code></td>
            <td>
              Mantiene tu sesión iniciada. Sin ella tendrías que volver a
              identificarte en cada página.
            </td>
            <td>Sesión / hasta cierre de sesión</td>
          </tr>
          <tr>
            <td><code>x-user-role</code></td>
            <td>
              Recuerda tu rol para no consultar la base de datos en cada
              navegación. Hace la plataforma más rápida.
            </td>
            <td>5 minutos</td>
          </tr>
          <tr>
            <td><code>x-user-access</code></td>
            <td>Recuerda el estado de tu suscripción para dar acceso al contenido.</td>
            <td>60 segundos</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Almacenamiento local del navegador</h2>
      <p>
        No son cookies, pero conviene saberlo: guardamos en tu navegador algunas
        preferencias que nunca salen de tu dispositivo.
      </p>
      <table>
        <thead>
          <tr>
            <th>Clave</th>
            <th>Para qué sirve</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sendero:sidebar:collapsed</code></td>
            <td>Recuerda si dejaste el menú lateral plegado.</td>
          </tr>
          <tr>
            <td><code>mitra:cookie-notice</code></td>
            <td>Recuerda que ya cerraste el aviso de cookies.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Cookies de terceros al reproducir vídeo</h2>
      <p>
        Los vídeos de las lecciones se sirven desde YouTube en{" "}
        <strong>modo sin cookies</strong> (dominio{" "}
        <code>youtube-nocookie.com</code>). Con esa configuración YouTube no
        instala cookies de seguimiento publicitario al cargar la página.
      </p>
      <p>
        Aun así, <strong>si pulsas reproducir</strong>, Google puede almacenar
        información técnica en tu dispositivo y recibir tu dirección IP para
        servir el vídeo. Ese tratamiento se rige por la{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          política de privacidad de Google
        </a>
        . Si no quieres que ocurra, basta con no reproducir el vídeo.
      </p>

      <h2>4. Cómo controlarlas</h2>
      <p>
        Puedes borrar o bloquear las cookies desde la configuración de tu
        navegador. Ten en cuenta que{" "}
        <strong>si bloqueas las cookies técnicas no podrás iniciar sesión</strong>,
        porque son las que mantienen tu sesión abierta.
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>
        </li>
        <li>
          <a href="https://support.mozilla.org/kb/borrar-cookies-datos-de-sitios-firefox" target="_blank" rel="noopener noreferrer">Firefox</a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>
        </li>
        <li>
          <a href="https://support.microsoft.com/microsoft-edge" target="_blank" rel="noopener noreferrer">Edge</a>
        </li>
      </ul>

      <h2>5. Cambios</h2>
      <p>
        Si en el futuro incorporamos cookies que no sean estrictamente
        necesarias, te pediremos consentimiento previo y actualizaremos esta
        página. Puedes consultar también la{" "}
        <Link href="/privacy">Política de Privacidad</Link>.
      </p>
    </LegalDoc>
  )
}
