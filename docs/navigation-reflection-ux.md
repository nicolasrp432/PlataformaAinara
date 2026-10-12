# Navegación y diario emocional

## Decisiones

- Desktop: cada enlace mantiene su propio fondo, con un fundido de 150 ms. El indicador ya no viaja entre filas ni usa el resorte de 400 ms. Se conserva `aria-current`, el modo colapsado y la navegación por teclado. La preferencia de movimiento reducido elimina la transición.
- Diario: cinco estados compatibles con la base de datos existente, con icono, color, etiqueta y ejemplos emocionales. La selección también se distingue con borde y check, sin depender exclusivamente del color.
- Una pregunta contextual facilita expresar cada estado sin juzgarlo. Se aclara que escribir es opcional.
- Los mismos colores se usan en el selector, el registro guardado, el calendario, el historial y el resumen de registros recientes. El resumen describe frecuencias, sin inferir diagnósticos ni relaciones causales.
- La entrada del diario usa un fundido breve sin desplazamientos ni demoras escalonadas.

## Referencias consultadas

- [Daylio](https://daylio.net/): registro rápido mediante selección del estado de ánimo, iconos y estadísticas. Adaptación: selección sencilla y distribución de las entradas disponibles.
- [How We Feel](https://howwefeel.org/): diario para identificar emociones y reconocer patrones.
- [Presentación de How We Feel por Apple](https://apps.apple.com/us/iphone/story/id1638393948): organización visual de emociones mediante colores. Adaptación: paleta constante acompañada de etiquetas e iconos.

No se añaden nuevos campos ni se modifica el contenido de entradas existentes.

## Validación

- `npm test`: 57 pruebas, 0 fallos.
- `npx tsc --noEmit` y ESLint de los componentes modificados: sin errores.
- `npm run build`: compilación de producción completa.
- Chromium con componentes reales en una página aislada: selector en 390 y 1440 px, selección exclusiva, preguntas contextuales, teclado, ausencia de desbordamiento y movimiento reducido.
- Chromium con sidebar real y contexto de rutas simulado: cambios entre opciones, indicador sin transformaciones, una única ruta activa, modo colapsado y movimiento reducido.

Las comprobaciones de navegador usan un contexto aislado; no ejercitan el guardado contra una cuenta de Supabase ni una sesión de producción.
