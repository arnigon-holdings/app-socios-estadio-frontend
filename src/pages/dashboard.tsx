import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LogOut, Star, Users, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { user, pointsBalance, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const age = new Date().getFullYear() - user.birth_year

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-primary px-4 py-4">
        <div className="mx-auto max-w-md flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary-foreground p-2">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-primary-foreground">App Socios</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tu Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">RUT</span>
              <span className="font-medium">{user.rut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teléfono</span>
              <span className="font-medium">{user.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Edad</span>
              <span className="font-medium">~{age} años</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verificado</span>
              <span className={user.phone_verified ? 'text-green-600' : 'text-yellow-600'}>
                {user.phone_verified ? '✓ Sí' : 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Código de referido</span>
              <span className="font-mono text-sm">{user.referral_code}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Star className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{pointsBalance}</p>
                <p className="text-sm text-muted-foreground">puntos disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Link
              to="/app/equipos"
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Users className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Equipos favoritos</p>
                  <p className="text-sm text-muted-foreground">
                    {user.teams_ids.length} equipo{user.teams_ids.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium">Miembro desde</p>
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
      </main>
    </div>
  )
}