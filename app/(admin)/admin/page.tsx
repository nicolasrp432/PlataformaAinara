import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, BookOpen, Users, BarChart3, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminStats,
  RecentUsers,
  RecentFormations,
  SectionSkeleton,
  StatsSkeleton,
} from "./overview-sections";

export const metadata: Metadata = {
  title: "Administración",
  description: "Contenido, personas y actividad de Mitra.",
};
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="ainara-page-header flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="ainara-eyebrow">MITRA / ADMINISTRACIÓN</p>
          <h1>El pulso de tu plataforma.</h1>
          <p>Contenido, personas y próximos pasos, en un mismo lugar.</p>
        </div>
        <Button asChild>
          <Link href="/admin/content/formations/new">
            <Plus size={16} />
            Nueva formación
          </Link>
        </Button>
      </header>
      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="ainara-panel">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl">Personas que llegan</h2>
            <Link
              href="/admin/users"
              className="text-sm font-semibold text-primary-strong"
            >
              Ver usuarios
            </Link>
          </div>
          <Suspense fallback={<SectionSkeleton />}>
            <RecentUsers />
          </Suspense>
        </section>
        <section className="ainara-panel">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl">Tu contenido reciente</h2>
            <Link
              href="/admin/content/formations"
              className="text-sm font-semibold text-primary-strong"
            >
              Ver catálogo
            </Link>
          </div>
          <Suspense fallback={<SectionSkeleton />}>
            <RecentFormations />
          </Suspense>
        </section>
      </div>
      <section>
        <p className="ainara-eyebrow">GESTIÓN DIARIA</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Organizar el contenido",
              body: "Publica y revisa tus formaciones.",
              href: "/admin/content/formations",
              icon: BookOpen,
            },
            {
              title: "Gestionar los accesos",
              body: "Roles, suscripciones y acceso permanente.",
              href: "/admin/users",
              icon: Users,
            },
            {
              title: "Consultar la actividad",
              body: "Comprueba participación y aprendizaje.",
              href: "/admin/analytics",
              icon: BarChart3,
            },
            {
              title: "Revisar comentarios",
              body: "Cuida las conversaciones de las lecciones.",
              href: "/admin/comments",
              icon: MessageSquare,
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="ainara-panel hover:border-primary"
            >
              <action.icon size={22} className="mb-5 text-primary-strong" />
              <h3 className="text-base">{action.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {action.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
