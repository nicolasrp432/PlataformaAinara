import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdmin } from "@/lib/guards";
import { Suspense } from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const userData = {
    id: user.id,
    full_name: user.user_metadata?.full_name || "Admin",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url as string | null,
    role: "admin" as const,
  };

  return (
    <div className="ainara-admin min-h-screen bg-background">
      <AdminSidebar user={userData} />
      <main className="md:pl-[var(--admin-sidebar-w,16rem)] transition-[padding] duration-200">
        <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 md:px-8 md:pt-10 lg:px-10">
          <Suspense
            fallback={
              <div role="status" className="admin-section-loading">
                Cargando esta sección…
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
