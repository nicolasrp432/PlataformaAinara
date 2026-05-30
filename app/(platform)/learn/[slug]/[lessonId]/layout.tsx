// El visor de lección es inmersivo: cancela el padding del contenedor de
// plataforma (`container p-6 pt-20 md:pt-6`) para ir a ancho/alto completo en
// mobile. Esto hace que el header sticky de la lección quede pegado al top del
// viewport (sin hueco) y elimina el solape con el menú global.
export default function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="-m-6 -mt-20 md:-mt-6 min-h-screen">{children}</div>
}
