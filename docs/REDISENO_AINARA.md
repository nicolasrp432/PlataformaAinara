# Rediseño de Mitra / Plataforma Ainara

## Entrega y dirección visual

La entrega continúa en el PR #12 del repositorio. No se publica en Sites ni se cambia el alojamiento existente.

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

## Puesta en servicio pendiente

1. Aplicar `migrations/0022_life_wheel.sql` en el proyecto Supabase existente antes de desplegar esta rama.
2. Mantener las variables y servicios del alojamiento existente. La portada necesita las variables públicas de Supabase durante el build para generar el catálogo; sin ellas muestra un estado vacío y reintenta en la siguiente revalidación.
3. Verificar con dos cuentas: A guarda y exporta una evaluación; B no puede acceder a los registros de A. Probar una segunda evaluación y la comparación.
4. Comprobar el panel admin con datos reales, búsqueda/paginación y permisos de una cuenta administradora frente a una cuenta estudiante.

No hay credenciales reales de Supabase disponibles en esta sesión, por lo que no se ha aplicado la migración ni se han medido latencias de base de datos o comprobado pagos. Si falta la tabla nueva, la rueda comunica que el guardado y el historial no están disponibles. La compilación conserva avisos previos sobre una imagen del editor admin, la ruta de imagen de Twitter y `metadataBase`.
