import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Check, Shield, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Team } from '@/types'

export function EquiposPage() {
  const { checkAuth } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsRes, meRes] = await Promise.all([
          api.get<{ teams: Team[] }>('/api/v1/teams'),
          api.get('/api/v1/me') as Promise<{ user: { teams_ids: number[] } }>
        ])
        setTeams(teamsRes.teams)
        setSelectedIds(meRes.user.teams_ids || [])
      } catch {
        setError('Error al cargar los equipos')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const toggleTeam = (teamId: number) => {
    setSelectedIds(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId)
      }
      if (prev.length >= 5) return prev
      return [...prev, teamId]
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await api.patch('/api/v1/me', { teams_ids: selectedIds })
      await checkAuth()
      setSuccess('¡Equipos actualizados correctamente!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando equipos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/app/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">Equipos Favoritos</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Equipos Favoritos</h1>
          <p className="text-muted-foreground">Selecciona hasta 5 equipos</p>
        </div>

        <Card className="bg-white card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Selecciona tus equipos
            </CardTitle>
            <CardDescription>
              Puedes elegir hasta 5 equipos favoritos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-emerald-500 bg-emerald-50 text-emerald-700 animate-fade-in">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              {teams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => toggleTeam(team.id)}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                    selectedIds.includes(team.id)
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  )}
                >
                  {selectedIds.includes(team.id) && <Check className="inline h-4 w-4 mr-1.5" />}
                  {team.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedIds.length}</span>/5 equipos seleccionados
              </p>
              {selectedIds.length >= 5 && (
                <p className="text-xs text-amber-600">Máximo alcanzado</p>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </CardContent>
        </Card>

        <Link to="/app/dashboard" className="block mt-6">
          <Button variant="outline" className="w-full h-12 border-border">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        </Link>
      </main>
    </div>
  )
}