"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { updateUserAccessAction, updateUserRoleAction } from "./actions"
import { toast } from "sonner"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  access_status: string | null
  level: number | null
  xp: number | null
  created_at: string | null
}

interface UsersTableProps {
  users: UserRow[]
}

const accessStatusConfig = {
  approved: {
    label: "Aprobado",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-700 border-amber-200",
  },
  suspended: {
    label: "Suspendido",
    icon: XCircle,
    className: "bg-rose-500/10 text-rose-700 border-rose-200",
  },
}

const roleConfig = {
  admin: { label: "Admin", className: "bg-purple-500/10 text-purple-700 border-purple-200" },
  mentor: { label: "Mentor", className: "bg-blue-500/10 text-blue-700 border-blue-200" },
  student: { label: "Estudiante", className: "bg-muted text-muted-foreground" },
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function UserActions({ user }: { user: UserRow }) {
  const [isPending, startTransition] = useTransition()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  function handleAccess(status: "pending" | "approved" | "suspended") {
    startTransition(async () => {
      const res = await updateUserAccessAction(user.id, status)
      if (res.success) {
        toast.success(
          status === "approved"
            ? `Acceso aprobado para ${user.full_name || "usuario"}`
            : status === "suspended"
            ? `Acceso suspendido para ${user.full_name || "usuario"}`
            : `Estado actualizado para ${user.full_name || "usuario"}`
        )
      } else {
        toast.error(res.error || "Error al actualizar acceso")
      }
    })
  }

  function handleRole(role: "student" | "mentor" | "admin") {
    startTransition(async () => {
      const res = await updateUserRoleAction(user.id, role)
      if (res.success) {
        toast.success(`Rol actualizado para ${user.full_name || "usuario"}`)
      } else {
        toast.error(res.error || "Error al actualizar rol")
      }
    })
  }

  const triggerButton = (
    <Button variant="ghost" size="icon" disabled={isPending}>
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MoreHorizontal className="h-4 w-4" />
      )}
    </Button>
  )

  // En mobile: bottom sheet con acciones táctiles grandes
  if (isMobile) {
    const closeAnd = (fn: () => void) => () => {
      setOpen(false)
      fn()
    }
    return (
      <>
        <span onClick={() => setOpen(true)}>{triggerButton}</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{user.full_name || "Usuario"}</SheetTitle>
            </SheetHeader>
            <div className="space-y-1">
              <p className="px-1 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Acceso</p>
              <Button variant="ghost" className="w-full justify-start h-12 text-emerald-700" disabled={user.access_status === "approved"} onClick={closeAnd(() => handleAccess("approved"))}>
                <CheckCircle2 className="mr-3 h-5 w-5" /> Aprobar acceso
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12" disabled={user.access_status === "pending"} onClick={closeAnd(() => handleAccess("pending"))}>
                <Clock className="mr-3 h-5 w-5" /> Marcar pendiente
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12 text-rose-600" disabled={user.access_status === "suspended"} onClick={closeAnd(() => handleAccess("suspended"))}>
                <XCircle className="mr-3 h-5 w-5" /> Suspender acceso
              </Button>
              <p className="px-1 pt-3 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Rol</p>
              <Button variant="ghost" className="w-full justify-start h-12" disabled={user.role === "student"} onClick={closeAnd(() => handleRole("student"))}>
                <Users className="mr-3 h-5 w-5" /> Estudiante
              </Button>
              <Button variant="ghost" className="w-full justify-start h-12" disabled={user.role === "mentor"} onClick={closeAnd(() => handleRole("mentor"))}>
                <ShieldAlert className="mr-3 h-5 w-5" /> Mentor
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acceso</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleAccess("approved")}
          disabled={user.access_status === "approved"}
          className="text-emerald-700 focus:text-emerald-700"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Aprobar acceso
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAccess("pending")}
          disabled={user.access_status === "pending"}
        >
          <Clock className="mr-2 h-4 w-4" />
          Marcar pendiente
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleAccess("suspended")}
          disabled={user.access_status === "suspended"}
          className="text-rose-600 focus:text-rose-600"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Suspender acceso
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Rol</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => handleRole("student")}
          disabled={user.role === "student"}
        >
          <Users className="mr-2 h-4 w-4" />
          Estudiante
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleRole("mentor")}
          disabled={user.role === "mentor"}
        >
          <ShieldAlert className="mr-2 h-4 w-4" />
          Mentor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UsersTable({ users }: UsersTableProps) {
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterRole, setFilterRole] = useState("all")

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      filterStatus === "all" || (u.access_status ?? "pending") === filterStatus
    const matchesRole = filterRole === "all" || (u.role ?? "student") === filterRole
    return matchesSearch && matchesStatus && matchesRole
  })

  const counts = {
    total: users.length,
    approved: users.filter((u) => u.access_status === "approved").length,
    pending: users.filter((u) => !u.access_status || u.access_status === "pending").length,
    suspended: users.filter((u) => u.access_status === "suspended").length,
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total, color: "text-foreground" },
          { label: "Aprobados", value: counts.approved, color: "text-emerald-700" },
          { label: "Pendientes", value: counts.pending, color: "text-amber-700" },
          { label: "Suspendidos", value: counts.suspended, color: "text-rose-700" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado de acceso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="approved">Aprobados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="suspended">Suspendidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="student">Estudiantes</SelectItem>
            <SelectItem value="mentor">Mentores</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Acceso</TableHead>
                <TableHead className="hidden sm:table-cell">Nivel / XP</TableHead>
                <TableHead className="hidden md:table-cell">Registro</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const statusKey =
                    (user.access_status as keyof typeof accessStatusConfig) ?? "pending"
                  const roleKey =
                    (user.role as keyof typeof roleConfig) ?? "student"
                  const statusCfg =
                    accessStatusConfig[statusKey] ?? accessStatusConfig.pending
                  const roleCfg = roleConfig[roleKey] ?? roleConfig.student
                  const StatusIcon = statusCfg.icon

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {(user.full_name || user.email || "?")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {user.full_name || "Sin nombre"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${roleCfg.className}`}>
                          {roleCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1 text-xs ${statusCfg.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">
                          Nv. {user.level ?? 1} · {(user.xp ?? 0).toLocaleString()} XP
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <UserActions user={user} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
