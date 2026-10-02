# Rediseño de Mitra / Plataforma Ainara

## Entrega y dirección visual

La entrega continúa en el [PR #12](https://github.com/nicolasrp432/PlataformaAinara/pull/12) del repositorio. No se publica en Sites ni se cambia el alojamiento existente.

Se conserva la marca Mitra, la voz y los contenidos reales de Ainara. La paleta vuelve al dorado original (#F6D25C y #B8902E), con degradados champagne, marfil cálido y tinta oscura. El dorado de los botones se acompaña de texto oscuro; para enlaces y etiquetas se usa un oro más profundo y legible. Fraunces y Plus Jakarta Sans aportan jerarquía editorial. Los tokens compartidos llevan esta identidad a la plataforma y a administración.

## Landing de venta

- Propuesta de valor, retrato real de Ainara y registro gratuito visible desde la primera pantalla.
- Necesidades que aborda el proyecto, catálogo publicado y explicación del acompañamiento.
- Demostración con pestañas de diario, rueda de la vida y aprendizaje; los ocho controles de la rueda actualizan el gráfico y se identifican como ejemplos que no se guardan.
- Comparación del acceso gratuito, pago único de 337,37 € y acompañamiento de 97 €/mes. Son opciones independientes; cancelar una suscripción conserva el contenido cuando también se ha comprado el acceso permanente.
- Preguntas frecuentes desplegables, condiciones, privacidad y llamadas al registro repartidas por el recorrido.
- Navegación y distribución adaptadas a móvil. Se reutilizan imágenes y contenido comercial existentes; los testimonios solo aparecen si el catálogo de testimonios reales tiene datos.

El contenido comercial es un componente de servidor. Solo se hidratan la demostración y los controles de registro; el formulario, autenticación y su dependencia de Supabase se descargan al abrir el registro. Se elimina el cargador global que ocultaba la portada dentro de una frontera de streaming; las rutas privadas conservan sus esqueletos específicos. La información y las preguntas frecuentes se pueden leer sin JavaScript.

## Plataforma y rueda de la vida

El dashboard prioriza diario, aprendizaje y foco personal. El diario mantiene calendario, clima emocional, edición, historial y privacidad, con un editor más amplio y dos columnas en escritorio.

La ruta privada `/rueda-de-la-vida` aparece en la navegación y en el dashboard. Incluye ocho áreas con controles 1–10, gráfico reactivo, selección de foco e intención. Cada área debe valorarse o confirmarse: el 5 inicial no cuenta como una evaluación. El guardado exige una intención escrita. Las instantáneas se comparan con las 24 últimas y se incluyen en la exportación de datos personales.

El servidor valida los valores y obtiene el usuario de la sesión. La tabla tiene RLS restringida al propietario y borrado en cascada con la cuenta. La política de privacidad incluye estas evaluaciones. La validación Zod se importa solo en el servidor para evitar añadirla al gráfico público. La herramienta se presenta como reflexión personal, no como diagnóstico.

## Administración y backend

- Navegación agrupada, sidebar colapsable en escritorio y panel accesible en móvil, con sección activa, regreso a la plataforma y salida de sesión.
- Resumen con cifras, últimas cuentas, últimas formaciones y accesos rápidos. Las secciones se entregan mediante Suspense y los conteos independientes se consultan en paralelo.
- Usuarios con búsqueda y filtros sobre toda la base de datos, paginación de 50 filas y conteos globales. Los filtros se conservan al cambiar de página y las páginas fuera de rango se redirigen. El formulario busca mediante GET; se limpian los separadores de expresiones PostgREST.
- Analíticas con conteos agregados de inscripciones por formación y recorrido paginado del catálogo completo. Se elimina el ranking basado en las primeras 100 inscripciones. El porcentaje de progreso usa registros completados / registros de progreso, en lugar de dividir lecciones por inscripciones.
- Mensajes de error explícitos para evitar presentar fallos de consulta como cifras cero; frontera de error con reintento.
- Guarda `requireAdmin` en layout, consultas y acciones de edición de formaciones y módulos. El middleware verifica el perfil real y deja de confiar en una cookie de rol sin firma; si no puede verificarlo, devuelve 503.
- Perfil y nivel de acceso comparten la lectura deduplicada por petición. Biblioteca y progreso usan Set/Map para evitar búsquedas repetidas por cada lección o formación. Metadatos y módulos se consultan en paralelo.
- Publicar, editar o eliminar formaciones invalida también la portada y los resúmenes que dependen del catálogo.
- Acciones de usuarios con nombres accesibles y contraseña temporal en un campo protegido.

## Validación y rendimiento

`npm test`, TypeScript y `npm run build` pasan. Los tests cubren acceso y precios vigentes, validación de evaluaciones, porcentaje de progreso, ranking sin muestreo y conservación/saneamiento de filtros.

El informe de producción reduce el JavaScript inicial de la landing de 262 kB en la versión anterior del PR a 140 kB, aproximadamente un 47 %. Es una comparación del tamaño indicado por Next.js, no una medición de tiempos reales con Supabase. El registro se descarga bajo demanda.

Las comprobaciones en Chromium cubren la landing de producción a 390, 768 y 1440 px, retrato, precios, pestañas, controles con teclado, registro, Escape, recuperación de foco y texto al 200 %. Los componentes reales de administración, diario y rueda se prueban en una muestra aislada con datos y acciones simulados: navegación móvil, colapso del menú, acciones de usuario, confirmación de áreas, intención y comparación tras guardar. Esta muestra no sustituye las pruebas de autenticación o escritura en Supabase.

## Revisión final: identidad y experiencia unificada

El símbolo de Mitra se rediseña como una M que reúne una persona y una raíz. El componente compartido de marca, el favicon SVG, el icono Apple de 180 px y las imágenes sociales usan el mismo dibujo y el degradado dorado. Las cabeceras de perfil, comunidad, asistente y mentoría comparten jerarquía visual. Se mantienen carta natal en el espacio privado, diario, rueda, logros, certificados y pestañas del perfil.

### Aislamiento entre cuentas

`0023_multiuser_isolation.sql` reemplaza las políticas permisivas anteriores de perfiles, conversaciones, participantes, mensajes, IA, notificaciones, muro y carta natal. El directorio `member_profiles` expone solo identidad y preferencias visibles; correo, nacimiento, facturación y estado de acceso permanecen fuera. El usuario puede editar su presentación, pero no asignarse rol, acceso permanente o XP. El estado de la interfaz se reinicia al cambiar de cuenta.

Las conversaciones se crean mediante una operación atómica que valida destinatario y preferencias; enviar un mensaje ya no añade al remitente a un hilo ajeno. La bandeja consulta resúmenes y conteos agregados, el historial tiene paginación por fecha e id y el respaldo recibe también el primer mensaje de un hilo vacío. Los cuerpos circulan por cambios de PostgreSQL sujetos a RLS; escritura, presencia y lectura usan canales privados. Políticas restrictivas protegen los temas `chat:*` incluso si existe una regla antigua permisiva. La presencia se muestra solo cuando el otro participante está conectado al canal. Se evita el aviso duplicado cuando el chat ya está abierto.

### IA

La API comprueba sesión, acceso completo, identificadores y propietario de la conversación antes de consultar el historial o el proveedor. El contenido de clase se obtiene con el cliente autenticado. Se recupera el historial reciente por contexto y se puede empezar otra conversación. El resumen se basa en descripción y texto disponibles, con instrucciones para reconocer contenido ausente.

Gemini y Groq se conectan mediante sus APIs de streaming: las claves viajan en cabeceras, hay tiempo máximo, cancelación y alternativa entre proveedores configurados. El lector SSE conserva UTF-8 y eventos partidos entre paquetes. Se guarda la respuesta real al completarse; una respuesta vacía o interrumpida presenta error y reintento, conservando el texto parcial en pantalla. Se eliminan las respuestas prefabricadas que antes simulaban un resultado exitoso cuando ningún proveedor funcionaba. El asistente no recibe diario, mensajes entre personas ni nacimiento. Una clase gratuita muestra la opción de acceso completo sin solicitar IA que la cuenta aún no tiene incluida.

### Mentoría y pagos

`0024_mentorship_bookings.sql` incorpora zona horaria del calendario, intervalos ocupados sin datos personales, reservas serializadas por mentor y caducidad de retenciones de pago. Se comprueban disponibilidad, bloqueos y solapamientos de duración, incluyendo reservas de otras cuentas. Una suscripción activa confirma la sesión incluida sin iniciar Stripe; el acceso permanente paga la sesión aparte.

Las solicitudes personalizadas se guardan en `mentorship_requests`. El panel de equipo muestra solo la agenda y solicitudes asignadas; administración puede revisar el conjunto. Permite compartir una videollamada HTTPS, guardar notas privadas del equipo, completar encuentros pasados y actualizar solicitudes. La navegación admin enlaza con la agenda. El participante consulta sus sesiones y el enlace, y el perfil distingue una retención caducada de un pago pendiente vigente. Se retira la promesa de cancelación automática a 24 horas, porque ese flujo no estaba implementado.

El webhook registra el evento después de procesarlo con éxito, de modo que un fallo permite reintentar. Las escrituras de acceso y suscripción comprueban errores; las operaciones son idempotentes. Un checkout sin pago no concede acceso. Un pago de mentoría tardío no desplaza otra reserva: se devuelve mediante una clave idempotente si el horario ya no puede confirmarse. Los checkouts expirados liberan su retención. Para eventos de suscripción se consulta su estado actual en Stripe.

### Aprendizaje y comunidad

`0025_learning_integrity.sql` separa el temario público del contenido protegido y aplica en base de datos la primera clase gratuita. El progreso se guarda mediante RPC y conserva una finalización aunque después llegue otro evento del reproductor. La finalización y los XP se conceden juntos, una sola vez; el bloqueo por formación y usuario protege también el certificado al completar clases simultáneas. El libro `xp_awards` evita repetir premios de lección o diario y conserva la escala anterior de 500 XP por nivel. El porcentaje de inscripción se actualiza al completar cada lección.

El cuestionario se corrige en servidor y debe pertenecer a la lección enviada. Opciones y enunciados públicos excluyen la respuesta correcta y las explicaciones de corrección. La cuenta no puede falsificar un intento aprobado ni crear certificados directamente. El vídeo retoma la posición más reciente; lecciones de texto y transcripciones se presentan con formato seguro, y Recursos enlaza únicamente con materiales HTTPS realmente guardados. El editor admin permite añadir y retirar esos enlaces y persistirlos con validación de hasta 50 recursos; se completa la pestaña que antes anunciaba una próxima versión.

`0026_community_integrity.sql` valida acceso, longitud y contexto de las respuestas. Los comentarios de la clase gratuita siguen disponibles en esa clase; publicar en la comunidad requiere acceso completo. Las reflexiones privadas no se leen ni reciben reacciones de otras cuentas. Resonancias se registran una vez por persona; una petición repetida no incrementa el contador. Los RPC antiguos inseguros quedan sin permisos públicos, preservando compatibilidad con instalaciones que tenían otra firma o tipo de retorno.

### Pruebas de esta revisión

- `npm test`: 28 casos. Diez ejecutan las migraciones reales en PostgreSQL mediante PGlite con roles y cuentas independientes: intentos de intrusión, privilegios del perfil, secretos de IA/carta/avisos, progreso y XP, reservas incluidas/de pago, canales privados con una política antigua abierta, cuestionarios, comunidad, agenda asignada y reaplicación de migraciones.
- Pruebas de rutas reales con adaptadores de Supabase y proveedores: autenticación y acceso, conversación ajena, proveedor ausente, alternativa Gemini/Groq, persistencia de respuesta, streams vacíos o incompletos, historial privado; webhook fallido y reintentado, duplicados, checkout sin pagar, devolución por conflicto y caducidad. `scripts/qa` contiene estos adaptadores; no llama a servicios reales.
- Validación de UTF-8/SSE, cambios de horario de verano, solapamientos, fechas/horas del perfil, preguntas, comentarios y enlaces de recursos, además de las comprobaciones anteriores de acceso, precios, portada, rueda y admin.
- TypeScript y compilación de producción. Se corrigen los avisos de imagen admin, runtime de Twitter y `metadataBase`; el aviso sobre imágenes dinámicas con runtime edge es informativo.
- Chromium con componentes reales y servicios simulados: IA en 390/768/1440 px, errores y reintento, texto parcial, sesión incluida, solicitud guardada, error de agenda, historial anterior de mensajes, recuperación del texto tras fallo, presencia privada, primer mensaje por respaldo y edición de agenda. Sin errores de ejecución ni desbordamiento horizontal en las pantallas comprobadas. Se comprueba además la landing de producción y sus iconos.

PGlite y esbuild son dependencias de desarrollo para estas pruebas; no se incorporan al JavaScript del sitio. La landing conserva los 140 kB iniciales indicados por Next.js. Los índices de mensajería, historial de IA y calendario respaldan las consultas; esto no representa una medición de latencias de la base de datos real.

### Preparación del entorno real

La entrega sigue siendo el PR #12, sin publicación en Sites. Esta sesión no tiene credenciales de Supabase, Gemini/Groq ni Stripe; no se modifica la base de datos o el alojamiento de producción.

Antes de desplegar en el alojamiento existente, aplicar en orden `0022_life_wheel.sql`, `0023_multiuser_isolation.sql`, `0024_mentorship_bookings.sql`, `0025_learning_integrity.sql` y `0026_community_integrity.sql` sobre el esquema canónico descrito en `scripts/004_unify_schema.sql`, con las tablas previas de mensajes, comentarios/reacciones, IA, cuestionarios, certificados y eventos de Stripe. Las migraciones contienen sus transacciones y se prueban al reaplicarlas; no son un esquema inicial para una base vacía.

Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_APP_URL` en el entorno existente. Configurar al menos `GEMINI_API_KEY` (también se aceptan `GOOGLE_API_KEY` o `GOOGLE_GENAI_API_KEY`) o `GROQ_API_KEY`; `GEMINI_MODEL` y `GROQ_MODEL` son opcionales. Los modelos por defecto son `gemini-2.5-flash`, `llama-3.3-70b-versatile` y `llama-3.1-8b-instant`, sujetos a disponibilidad de cada cuenta. Mantener las claves y precios de Stripe existentes y su webhook firmado. Asociar `mentors.user_id` a la cuenta mentora y comprobar su `timezone` y disponibilidad. Si falta el proveedor de IA, el asistente informa de indisponibilidad.

Queda validar en el Supabase real la autenticación de dos cuentas, las relaciones de las vistas en PostgREST, la autorización/publicación de Realtime, la agenda asignada y las llamadas efectivas a proveedores y pagos en modo de prueba. Los límites de frecuencia actuales son por instancia de servidor; para una cuota global entre varias instancias hará falta un almacén compartido. Las pruebas simuladas y el motor PostgreSQL local no acreditan disponibilidad de terceros, esquema vivo ni rendimiento bajo carga de producción.
