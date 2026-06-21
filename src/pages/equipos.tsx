import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Check } from 'lucide-react'
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
      setSuccess('Equipos actualizados correctamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-primary px-4 py-4">
        <div className="mx-auto max-w-md flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="text-primary-foreground">
            <Link to="/app/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-primary-foreground">Equipos Favoritos</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Selecciona tus equipos</CardTitle>
            <CardDescription>
              Puedes elegir hasta 5 equipos favoritos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => toggleTeam(team.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition-colors flex items-center gap-2",
                    selectedIds.includes(team.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {selectedIds.includes(team.id) && <Check className="h-4 w-4" />}
                  {team.name}
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedIds.length}/5 equipos seleccionados
            </p>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}