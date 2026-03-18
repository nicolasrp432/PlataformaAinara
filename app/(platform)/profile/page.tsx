import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Flame, Star } from "lucide-react"

export const metadata: Metadata = {
  title: "Mi Perfil | Ainara",
  description: "Gestiona tu información personal y visualiza tu evolución.",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch the extended profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const userData = {
    id: user.id,
    name: user.user_metadata?.full_name || profile?.full_name || "Usuario",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url || "",
    role: profile?.role || "student",
    level: profile?.level || 1,
    xp: profile?.xp ?? 0,
    streak: profile?.streak_days || 0,
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 relative">
      
      {/* Dynamic Header */}
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          Mi <span className="font-semibold text-primary">Perfil</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          Aquí radica tu esencia como pensador y creador dentro de nuestra comunidad. Explora tus logros y actualiza tu identidad.
        </p>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* Left Column: Avatar & Main Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-black/5 overflow-hidden group">
             {/* Beautiful abstract top banner */}
             <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent w-full relative transition-all duration-500 group-hover:from-primary/40" />
             
             <CardContent className="px-6 py-0 pb-6 relative z-10 text-center">
                 <div className="flex justify-center -mt-14 mb-5">
                    <Avatar className="h-28 w-28 border-[6px] border-background shadow-xl transition-transform duration-300 hover:scale-105">
                      <AvatarImage src={userData.avatarUrl} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                        {userData.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                 </div>
                 
                 <div className="space-y-1.5 mb-6">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">{userData.name}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{userData.email}</p>
                 </div>

                 <div className="flex justify-center items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/25 border-none transition-colors px-3 py-1">
                      {userData.role === 'admin' ? 'Fundador' : 'Aventurero'}
                    </Badge>
                    <Badge variant="outline" className="border-primary/20 text-foreground px-3 py-1 bg-background/50">
                      Nivel {userData.level}
                    </Badge>
                 </div>
             </CardContent>
          </Card>

          {/* Detailed Stats */}
          <Card className="border-border/50 shadow-md shadow-black/5 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-foreground tracking-tight">Evolución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 transition-colors hover:bg-orange-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/15 rounded-lg text-orange-500 shadow-inner">
                      <Flame className="w-5 h-5 fill-orange-500/20" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Racha</p>
                      <p className="text-xs text-muted-foreground">Constancia</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xl text-foreground">{userData.streak}</span>
                    <span className="text-xs text-muted-foreground block -mt-1">Días</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/15 rounded-lg text-primary shadow-inner">
                      <Star className="w-5 h-5 fill-primary/20" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Experiencia</p>
                      <p className="text-xs text-muted-foreground">Conocimiento</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xl text-foreground">{userData.xp}</span>
                    <span className="text-xs text-primary block -mt-1 font-medium">XP</span>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
           <ProfileForm initialData={{ id: userData.id, full_name: userData.name, avatar_url: userData.avatarUrl }} />

           <Card className="border-border/50 shadow-sm bg-card/40 backdrop-blur-sm relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
             <CardHeader className="pb-3">
               <CardTitle className="text-lg font-medium">Privacidad y Seguridad</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                 Tu información personal está protegida. Al formar parte de esta comunidad, tu nombre y avatar serán 
                 visibles para otros integrantes cuando interactúes en La Taberna y en foros de discusión.
               </p>
               <div className="p-4 bg-muted/50 rounded-lg border border-border/50 text-xs text-muted-foreground flex items-center justify-between">
                 <span>Gestión de credenciales administrada por Supabase Auth.</span>
                 <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary/70 border-primary/20 bg-primary/5">Asegurado</Badge>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
