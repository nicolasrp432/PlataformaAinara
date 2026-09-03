# Pruebas

Comprobaciones de las reglas puras que deciden **quién ve qué**. No necesitan
base de datos ni navegador: se ejecutan sobre las funciones de `lib/access.ts`
y `lib/formation-covers.ts` directamente.

```bash
npm test
```

Usan el ejecutor y el `assert` que trae Node, sin dependencias añadidas: Node
descarta los tipos de TypeScript al vuelo desde la v22.18.

## Por qué existen

`lib/access.ts` decide si una lección se abre o se cobra, y si una ruta exige
suscripción. Un fallo ahí no se ve: no rompe la pantalla, simplemente regala
contenido de pago o bloquea a quien ya pagó. Es justo el tipo de error que
conviene detectar en un segundo y no en producción.
