import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LogOut, Users, Calendar, Shield, CheckCircle2, AlertCircle, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { user, pointsBalance, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const age = new Date().getFullYear() - user.birth_year

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">App Socios</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">¡Bienvenido!</h1>
          <p className="text-muted-foreground">Socio {user.rut}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Tu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">RUT</span>
                <span className="font-semibold">{user.rut}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">Teléfono</span>
                <span className="font-semibold">{user.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground text-sm">Edad</span>
                <span className="font-semibold">~{age} años</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">Verificado</span>
                <span className={cn(
                  "flex items-center gap-1.5 font-semibold text-sm",
                  user.phone_verified ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {user.phone_verified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Verificado
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Pendiente
                    </>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-4xl font-bold">{pointsBalance}</p>
                  <p className="text-sm text-white/80">puntos disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/app/equipos" className="block">
            <Card className="bg-white card-shadow hover:card-shadow-hover transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Equipos favoritos</p>
                      <p className="text-sm text-muted-foreground">
                        {user.teams_ids.length} equipo{user.teams_ids.length !== 1 ? 's' : ''} seleccionados
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-white card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Miembro desde</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  )
}