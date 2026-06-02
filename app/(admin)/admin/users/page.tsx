import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { UsersTable } from "./users-table"

export const metadata: Metadata = {
  title: "Gestión de Usuarios — Admin Μήτρα",
}

export const dynamic = "force-dynamic"

async function getUsers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, access_status, level, xp, created_at")
    .order("created_at", { ascending: false })

  return data ?? []
}

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra el acceso y roles de los usuarios registrados en la plataforma.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  )
}
