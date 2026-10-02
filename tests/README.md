# Pruebas

Comprobaciones de las reglas puras que deciden **quién ve qué**. No necesitan
base de datos ni navegador: se ejecutan sobre las funciones de `lib/access.ts`
y `lib/formation-covers.ts` directamente.

```bash
npm test
```

Usan el ejecutor y el `assert` que trae Node, sin dependencias añadidas: Node
descarta los tipos de TypeScript al vuelo desde la v22.18.

La auditoría de diálogos recorre el AST de todos los `.tsx`/`.jsx` bajo `app/`
y `components/`, también los componentes dinámicos y las dos ramas responsive
de reserva. Simula la apertura consecutiva de carta natal, nuevo mensaje,
reserva, restablecimiento y formularios administrativos, y reproduce como fallo
la advertencia de consola de Radix si un `DialogContent`/`SheetContent` pierde su
título o descripción. Una descripción sólo visualmente oculta debe conservarse
con `sr-only`; no se permite silenciar `aria-describedby` en el primitive global.

## Por qué existen

`lib/access.ts` decide si una lección se abre o se cobra, y si una ruta exige
suscripción. Un fallo ahí no se ve: no rompe la pantalla, simplemente regala
contenido de pago o bloquea a quien ya pagó. Es justo el tipo de error que
conviene detectar en un segundo y no en producción.
