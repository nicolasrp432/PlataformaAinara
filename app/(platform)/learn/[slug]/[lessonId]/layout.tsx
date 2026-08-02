// El visor de lección es inmersivo: cancela el padding del contenedor de
// plataforma (`px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6`) para ir a ancho y
// alto completo. La cabecera y la barra inferior globales de móvil se ocultan
// solas en esta ruta (ver `isImmersiveRoute` en lib/navigation.ts), así que el
// header sticky de la lección queda pegado al top y su barra de acciones
// inferior no se solapa con la navegación global.
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-mx-4 -mb-28 -mt-4 min-h-screen md:-mx-6 md:-mb-10 md:-mt-6">
      {children}
    </div>
  )
}
