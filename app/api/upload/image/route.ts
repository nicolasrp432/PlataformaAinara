import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"

const BUCKET = "public_assets"

/**
 * Emite una URL firmada para subir una imagen directa a Supabase Storage.
 *
 * El fichero NO pasa por aquí: el navegador lo envía a Storage con el token
 * que devuelve esta ruta. Así se esquivan los límites de tamaño del cuerpo de
 * una función serverless, que era lo que rompía la subida de portadas.
 *
 * El permiso se comprueba en este punto y la firma la emite el cliente de
 * servicio, de modo que la subida no depende además de las políticas RLS del
 * bucket: antes, si la migración de políticas no estaba aplicada, fallaba
 * todo sin decir por qué.
 */
const FOLDER_RULES = {
  "thumbnails/formations": { adminOnly: true },
  avatars: { adminOnly: false },
} as const

type Folder = keyof typeof FOLDER_RULES

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "gif"])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 })
  }

  maybeSweep()
  const rl = rateLimit(request, "upload-image", { windowMs: 60_000, max: 20 }, user.id)
  const rlResp = rateLimitResponse(rl)
  if (rlResp) return rlResp

  let body: { folder?: string; extension?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 })
  }

  const folder = body.folder as Folder | undefined
  if (!folder || !(folder in FOLDER_RULES)) {
    return NextResponse.json({ error: "Destino no permitido." }, { status: 400 })
  }

  const extension = (body.extension ?? "jpg").toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Formato de imagen no admitido." }, { status: 400 })
  }

  if (FOLDER_RULES[folder].adminOnly) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Solo un administrador puede cambiar la portada." },
        { status: 403 },
      )
    }
  }

  // El nombre lo decide el servidor: el del fichero del usuario nunca llega a
  // formar parte de la ruta, así que no hay forma de escaparse del directorio.
  const name = `${user.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`
  const path = `${folder}/${name}`

  const admin = supabaseAdmin()

  let { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)

  // Si el bucket no existe (la migración de storage nunca se ejecutó), se crea
  // y se reintenta una vez. Sin esto, cada subida fallaba con un «Bucket not
  // found» que no dice a nadie qué hay que hacer, y la única salida era entrar
  // al panel de Supabase.
  if (error && /not found/i.test(error.message)) {
    const { error: createError } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/avif",
        "image/gif",
      ],
    })

    // Otra petición simultánea puede haberlo creado ya; eso no es un fallo.
    if (createError && !/already exists/i.test(createError.message)) {
      console.error("[upload/image] no se pudo crear el bucket:", createError)
      return NextResponse.json(
        { error: "El almacenamiento no está configurado. Avisa al equipo." },
        { status: 502 },
      )
    }

    ;({ data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path))
  }

  if (error || !data) {
    console.error("[upload/image] no se pudo firmar la subida:", error)
    return NextResponse.json(
      { error: "El almacenamiento no está disponible. Avisa al equipo." },
      { status: 502 },
    )
  }

  const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    bucket: BUCKET,
    path: data.path,
    token: data.token,
    publicUrl: publicUrlData.publicUrl,
  })
}
