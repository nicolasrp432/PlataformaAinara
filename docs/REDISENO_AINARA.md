# Rediseño de Mitra / Plataforma Ainara

## Dirección visual y experiencia

Se conserva la marca comercial Mitra y el contenido real de Ainara. La nueva dirección combina tinta verde petróleo, superficies claras, serif editorial y más espacio de lectura. Los tokens compartidos se propagan a formularios, tarjetas, botones, diálogos, biblioteca, perfil, carta natal, comunidad, mensajes, mentoría y administración; no se sustituyen sus servicios ni contratos de datos.

La landing pasa de un titular centrado con resplandor a una composición asimétrica con el retrato existente de Ainara. Mantiene catálogo, precios, preguntas, registro, enlaces legales y contenido comercial real. El dashboard pone primero el diario, el aprendizaje y el foco personal; la venta de acceso aparece después de la actividad principal. El diario mantiene calendario, clima emocional, edición, historial y privacidad, con editor de mayor tamaño y distribución en dos columnas en escritorio.

## Fortalezas observadas

- Arquitectura App Router con componentes de servidor y streaming por sección en el dashboard.
- Reutilización de primitivas Radix y tokens comunes, notificaciones centralizadas y navegación compartida entre móvil y escritorio.
- Servicios de acceso, formación, progreso, mentoría, carta natal y reflexión ya integrados.
- Precios centralizados; catálogo público con revalidación; migraciones existentes y exportación de datos personales.
- Retratos y portadas reales disponibles: se reutilizan sin inventar testimonios ni cifras.

## Debilidades y actuaciones

- Jerarquía visual repetitiva, texto muy pequeño y exceso de dorado/resplandores: se reorganizan landing, dashboard y diario, se aumenta la escala mínima y se aplica una identidad común verde petróleo.
- Variable tipográfica `--font-display` referenciada a sí misma: se separa el nombre de la variable de Next/font del token Tailwind para que Fraunces resuelva correctamente.
- Permisos del middleware derivados de una cookie de perfil sin firma: se elimina esa confianza y se consulta el perfil real autenticado. Si no puede verificarse, responde 503. Hay una consulta adicional por petición protegida; es un coste deliberado para evitar autorización basada en datos manipulables del navegador.
- Comparación comercial incorrecta («menos de media sesión») con precio actual de 97 € frente a sesión de 150 €: se elimina la afirmación y se usan los precios vigentes de `lib/pricing.ts`.
- Tests desfasados de precios y mensajería: se alinean con los valores ya presentes en main, sin modificar tarifas ni derechos de acceso.

## Rueda de la vida

Ruta privada `/rueda-de-la-vida`, disponible para cuentas autenticadas con acceso a plataforma. Visible en navegación móvil/secundaria, escritorio y dashboard. Ocho áreas con controles 1–10, gráfico reactivo y selección de foco. Cada área debe valorarse o confirmarse; el 5 inicial no se presenta como una evaluación real. Es necesario escribir una intención antes de guardar. Las instantáneas se guardan en Supabase, se comparan con las 24 últimas y se exportan junto a los datos de la cuenta.

El servidor valida los ocho enteros, la prioridad y la intención; obtiene el usuario de la sesión en lugar de aceptar un identificador enviado por el navegador. La tabla usa RLS con acceso exclusivo del propietario y borrado en cascada cuando se elimina la cuenta. La herramienta se presenta como reflexión personal, no como diagnóstico.

### Puesta en servicio

1. Aplicar `migrations/0022_life_wheel.sql` en el proyecto Supabase existente antes de desplegar la rama.
2. Mantener las variables reales de Supabase y el resto de servicios del despliegue existente.
3. Verificar con dos cuentas: A guarda una evaluación y solo A puede consultarla o exportarla; B no puede acceder a registros de A por la API. Probar una segunda evaluación y la comparación.

No se ha aplicado la migración a una base real desde esta sesión: no se han suministrado credenciales del proyecto Supabase. Si falta la tabla, la pantalla conserva la exploración y comunica que el historial/guardado no está disponible.

## Sites y límites de validación

Se han leído y aplicado las habilidades de Sites para orientar el rediseño y conservar la arquitectura. La instalación de este entorno expone las herramientas remotas de Sites, pero no contiene los scripts locales requeridos (`site-workflow.mjs`, `project-setup.mjs`). No se ha creado ni publicado un Site vacío ni se ha migrado la plataforma autenticada a un hosting diferente sin su configuración real. La rama de GitHub es el entregable revisable.

La comprobación visual local de la landing utiliza el servidor de producción. Los controles internos pueden verificarse con una muestra aislada de los componentes reales; esa muestra usa datos de prueba y no constituye validación de Supabase, autenticación, pagos o datos de usuarios. La publicación Sites y las pruebas con cuentas reales quedan pendientes de esos recursos.
