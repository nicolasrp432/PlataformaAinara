import { redirect } from "next/navigation"

// La carta natal real (persistida en `natal_charts`) vive en el perfil.
// Esta ruta contenía un formulario duplicado con lógica dummy sin
// persistencia; se conserva solo como redirección para enlaces antiguos.
export default function UsuarioPage() {
  redirect("/profile")
}
