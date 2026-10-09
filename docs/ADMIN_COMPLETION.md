# Administración y recorrido formativo

La gestión de contenido comparte un editor de temario entre la pestaña **Contenido** de cada formación y `/admin/content/modules`. Permite ordenar módulos y lecciones con ratón, pantalla táctil o teclado, mover una lección a otro módulo mediante el selector, publicar módulos y crear vídeos, artículos, ejercicios, audios y cuestionarios. El botón **Guardar orden** persiste el temario completo en una transacción y rechaza listas desactualizadas o identificadores de otra formación.

Las vistas previas viven bajo `/admin/content/formations/[id]/preview` y `/admin/content/lessons/[id]/preview`. Requieren rol administrador, incluyen borradores y muestran la versión guardada. Las respuestas de prueba no se envían al endpoint de evaluación ni generan progreso, XP o certificados. La vista previa de una lección ya no construye una URL de alumno con el UUID en lugar del slug.

Los artículos se escriben en Markdown en **Contenido del artículo**. Los cuestionarios se pueden crear y editar desde la lección o `/admin/content/quizzes`: preguntas ordenables, opción múltiple y verdadero/falso con exactamente una respuesta correcta. El guardado de todas las preguntas y opciones es atómico. Se conservan los intentos históricos al editar; sus respuestas siguen refiriéndose a la versión anterior de las preguntas. Los alumnos ven las explicaciones después de entregar la evaluación.

`/admin/mentorship` reúne la disponibilidad semanal, las fechas bloqueadas, la zona horaria, el precio, la duración y la asignación del responsable con la agenda y las solicitudes existentes. Solo una agenda puede estar activa para las reservas de Ainara. Los cambios de disponibilidad no reprograman sesiones existentes. Se puede añadir el enlace, mantener notas privadas, completar sesiones, registrar ausencias y cancelar con un motivo que recibe el alumno. La cancelación de una sesión de pago no ejecuta reembolsos de Stripe; la interfaz lo indica. El cambio de enlace genera una notificación sin incluir las notas privadas.

Las notificaciones admiten enlaces internos y HTTPS. La audiencia por formación usa inscripciones; el envío y su historial son una transacción SQL sin el límite de filas de la API. Una clave por envío evita duplicados al reintentar una solicitud sin cambios. El historial se actualiza al enviar. No se envían correos electrónicos: este flujo gestiona notificaciones dentro de la plataforma.

La bandeja de testimonios permite filtrar estados, reproducir vídeos, consultar consentimiento y reportes, publicar, rechazar con motivo y archivar. No permite publicar un testimonio autorizado únicamente para revisión interna. La comunidad respeta la audiencia; la portada consulta una vista con solo los campos públicos y únicamente testimonios autorizados para web pública. Las evidencias de autorización no se incluyen en esa vista.

Los certificados se descargan como PDF A4 horizontal desde el perfil del alumno y desde administración. La descarga verifica sesión y propiedad/rol, respeta RLS y no usa caché compartida. La fuente Lora se incluye con su licencia OFL para funcionar sin descargar fuentes durante cada solicitud. La recuperación de un certificado pendiente exige completar todas las lecciones publicadas y no duplica certificados existentes.

## Activar en Supabase

Requisitos: el esquema PostgreSQL existente de la plataforma, las migraciones de acceso, mentorías, aprendizaje y comunidad (`0023`–`0026`) y `scripts/009_notifications.sql`. El instalador incorpora `0027` y `0028` si faltan la tabla de testimonios o sus campos de consentimiento. `0001_initial_schema.sql` es un esquema histórico SQLite: no debe ejecutarse para inicializar el proyecto PostgreSQL.

### Opción sencilla: pegar un único SQL

No necesitas `DATABASE_URL` si usas el editor de Supabase. Las variables `.env.local` conectan la aplicación; por sí solas no crean las tablas ni las funciones nuevas.

1. Abre [SQL Editor del proyecto](https://supabase.com/dashboard/project/suseccacxdfozgsxkmxx/sql/new) con una cuenta que tenga acceso.
2. Abre [`scripts/sql/ACTIVAR_ADMIN_Y_RUEDA.sql`](../scripts/sql/ACTIVAR_ADMIN_Y_RUEDA.sql), copia **todo el archivo**, pégalo en una consulta nueva y pulsa **Run**.
3. El resultado debe indicar `Activación completada`, `rueda_disponible = true` y `testimonios_disponibles = true`. `lecciones_de_ejemplo` debe ser 4 si existe el temario de Emulsión Energética; si es 0, revisa el aviso de la consulta: no se ha encontrado una formación/módulo con lecciones donde insertar los ejemplos.
4. Reinicia el servidor local (`npm run dev`) y entra con tu cuenta de administrador. El SQL actualiza la base; para ver este código en la web de Vercel también hace falta desplegar esta versión.

El archivo incorpora `0022` (rueda), `0027` si falta testimonios, `0028` y `0030`–`0033`, todo en una transacción. Se puede volver a ejecutar y no duplica los ejemplos ni sustituye sus cambios editoriales. `npm run db:admin:sql` regenera el archivo a partir de las migraciones originales. Las pruebas ejecutan exactamente este archivo dos veces.

Si Supabase devuelve un error, copia el mensaje de error completo para revisarlo; no ejecutes fragmentos sueltos del archivo. Los cambios del bloque se revierten juntos.

La revisión local del 9 de octubre encontró `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas; `SUPABASE_SERVICE_ROLE_KEY` todavía contiene un valor de ejemplo. Esa clave de servidor debe sustituirse por la real para los flujos existentes que la usan. Nunca debe llevar prefijo `NEXT_PUBLIC_` ni pegarse en el chat.

### Alternativa: conexión PostgreSQL

Con `DATABASE_URL` configurada (y `DATABASE_SSL_CA` si hace falta), `npm run db:admin` instala las migraciones del admin desde terminal. La opción SQL anterior incluye además la creación de la tabla de la rueda si no existía. La clave de servicio de Supabase no sustituye a una conexión PostgreSQL para ejecutar este comando.

Si hay varias formaciones con el mismo título, se prioriza la publicada. La migración `0031` añade dos artículos y dos cuestionarios dentro de un módulo existente de **Emulsión Energética**, cerca de la mitad del recorrido. Conserva los identificadores, el contenido y el orden relativo de las lecciones previas; no publica módulos ni formaciones que estaban en borrador. Los ejemplos son editables y están identificados como contenido de ejemplo. Volver a ejecutar la migración no los duplica ni sobrescribe cambios editoriales. Si la formación o sus lecciones no existen, emite un aviso y no crea una formación ficticia. Añadir lecciones publicadas amplía el temario que deben completar los alumnos; los certificados ya emitidos se conservan.

## Rueda de la vida

`/rueda-de-la-vida` tiene ocho colores e iconos, valoración guiada por área con un control accesible por teclado, progreso explícito y un gráfico que solo muestra como respuestas los valores confirmados o ajustados. Al terminar ofrece un área de apoyo y otra a la que prestar atención, sin imponer la prioridad. El usuario elige su intención y guarda una nueva instantánea privada.

La comparación usa la primera evaluación real, consultada por separado para conservar el punto de partida incluso al superar las 24 entradas recientes. La sección de evolución compara esa primera evaluación con la última guardada y muestra los cambios por área, junto con el compromiso más reciente. Se mantienen los informes individuales y la exportación mediante la impresión del navegador a PDF. Los borradores no sobrescriben evaluaciones guardadas; un fallo de guardado conserva las respuestas para reintentarlo.

## Comprobaciones

- `npm test`: incluye pruebas reales de SQL sobre PGlite (motor PostgreSQL), aislamiento entre roles, transacciones, ordenación, semillas repetibles, campañas, calendario, emisión de certificados y generación del PDF. Los handlers HTTP se ejecutan con adaptadores de autenticación/base de datos aislados para comprobar autorización y errores.
- `npm run test:wheel-ui`: recorre las ocho áreas con teclado, verifica la comparación con un punto de partida fuera del historial reciente, el primer guardado, recuperación ante errores, informes y diseño móvil. Usa componentes reales y persistencia simulada.
- `npm run lint` y `npm run build`: análisis estático y compilación de todas las rutas.
- `npm run test:admin-ui`: Chromium con los componentes reales y acciones de servidor simuladas. Comprueba arrastre con ratón, botones de orden, movimiento entre módulos, recuperación ante fallos, publicación, cuestionario de prueba, calendario, moderación, enlaces internos y diseño a 390 px. Usa el CSS generado por `npm run build`; instalar Chromium con `npx playwright install chromium` si no está disponible.

Las pruebas aisladas no sustituyen la validación autenticada contra Supabase. No se deben presentar las migraciones como aplicadas ni los ejemplos como cargados en producción hasta verificarlo en el proyecto real.

### Estado de esta entrega

Verificado: 57 pruebas automatizadas, ESLint, compilación de producción y pruebas de interfaz en Chromium (escritorio y móvil). La configuración pública local apunta al proyecto indicado y permite consultar su catálogo. Se comprobó que la base todavía no dispone de `community_testimonials`.

Pendiente: ejecutar el SQL único en Supabase (o utilizar una conexión PostgreSQL válida con el instalador) y verificar los recorridos con sesiones reales de administrador y alumno. Las migraciones y los ejemplos todavía no se han aplicado a la base remota. La clave de servicio local también sigue pendiente para los flujos existentes que la utilizan. No se ha desplegado esta entrega.

Referencias técnicas: [dnd-kit Sortable](https://dndkit.com/legacy/presets/sortable/overview/), [PDF-LIB](https://pdf-lib.js.org/docs/api/classes/pdfdocument), [conexión PostgreSQL de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

Guía oficial: [SQL Editor de Supabase](https://supabase.com/docs/guides/database/overview).
