import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, ChevronRight, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { SelfieCapture } from '@/components/selfie-capture'
import type { Team } from '@/types'

function validarRUT(rut: string): boolean {
  const cleaned = rut.replace(/[^0-9Kk]/g, '')
  if (cleaned.length < 8) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()

  let sum = 0
  let multiplier = 2

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const expectedDv = 11 - remainder

  if (expectedDv === 11) return dv === '0'
  if (expectedDv === 10) return dv === 'K'
  return parseInt(dv) === expectedDv
}

function formatRUT(value: string): string {
  const cleaned = value.replace(/[^0-9Kk]/g, '')
  if (cleaned.length <= 1) return cleaned.toUpperCase()
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1).toUpperCase()
  return `${body}-${dv}`
}

const STEPS = [
  { id: 1, title: 'RUT' },
  { id: 2, title: 'Teléfono' },
  { id: 3, title: 'Contraseña' },
  { id: 4, title: 'Foto' },
  { id: 5, title: 'Equipos' },
  { id: 6, title: 'Consentimientos' },
  { id: 7, title: 'Confirmar' },
]

interface FormData {
  rut: string
  phone: string
  password: string
  birthMonth: number
  birthYear: number
  photoBase64: string
  teamsIds: number[]
  consents: {
    lgpd: boolean
    terms: boolean
    photoUsage: boolean
  }
}

export function RegistroPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [error, setError] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [formData, setFormData] = useState<FormData>({
    rut: '',
    phone: '',
    password: '',
    birthMonth: 1,
    birthYear: 1990,
    photoBase64: '',
    teamsIds: [],
    consents: {
      lgpd: false,
      terms: false,
      photoUsage: false,
    },
  })

  const loadTeams = async () => {
    setIsLoadingTeams(true)
    try {
      const data = await api.get<{ teams: Team[] }>('/api/v1/teams')
      setTeams(data.teams)
    } catch {
      setTeams([])
    } finally {
      setIsLoadingTeams(false)
    }
  }

  const handleNext = async () => {
    setError('')

    if (step === 1) {
      const cleanedRut = formData.rut.replace(/[^0-9Kk]/g, '')
      if (!validarRUT(cleanedRut)) {
        setError('RUT inválido. Verifica el dígito verificador.')
        return
      }
      setFormData(prev => ({ ...prev, rut: formatRUT(cleanedRut) }))
    }

    if (step === 2) {
      const phoneDigits = formData.phone.replace(/\D/g, '')
      if (phoneDigits.length !== 8) {
        setError('El teléfono debe tener 8 dígitos.')
        return
      }
    }

    if (step === 3) {
      if (formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.')
        return
      }
    }

    if (step === 4) {
      if (!formData.photoBase64) {
        setError('Debes tomar o subir una foto para continuar.')
        return
      }
    }

    if (step === 5 && teams.length === 0) {
      await loadTeams()
    }

    if (step === 6) {
      const { lgpd, terms, photoUsage } = formData.consents
      if (!lgpd || !terms || !photoUsage) {
        setError('Debes aceptar todos los consentimientos para continuar.')
        return
      }
    }

    if (step === 7) {
      await handleSubmit()
      return
    }

    setStep(prev => Math.min(prev + 1, 7))
  }

  const handleBack = () => {
    if (step > 1) {
      setError('')
      setStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const cleanedRut = formData.rut.replace(/[^0-9Kk]/g, '').toUpperCase()

      await api.post('/api/v1/users', {
        rut: cleanedRut,
        phone: `+569${formData.phone.replace(/\D/g, '')}`,
        password: formData.password,
        birth_month: formData.birthMonth,
        birth_year: formData.birthYear,
        photo: formData.photoBase64,
        teams_ids: formData.teamsIds,
        consents: {
          lgpd: formData.consents.lgpd,
          terms: formData.consents.terms,
          photo_usage: formData.consents.photoUsage,
        },
      })

      navigate('/registro/exito')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTeam = (teamId: number) => {
    setFormData(prev => {
      const current = prev.teamsIds
      if (current.includes(teamId)) {
        return { ...prev, teamsIds: current.filter(id => id !== teamId) }
      }
      if (current.length >= 5) return prev
      return { ...prev, teamsIds: [...current, teamId] }
    })
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i - 16)

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                type="text"
                placeholder="12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: formatRUT(e.target.value) }))}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Sin puntos, con guión. Ej: 12345678-9
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">+569</span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setFormData(prev => ({ ...prev, phone: digits }))
                  }}
                  maxLength={8}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa los 8 dígitos de tu número celular
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthMonth">Mes de nacimiento</Label>
                <select
                  id="birthMonth"
                  value={formData.birthMonth}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthMonth: parseInt(e.target.value) }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthYear">Año de nacimiento</Label>
                <select
                  id="birthYear"
                  value={formData.birthYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthYear: parseInt(e.target.value) }))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selfie para verificación de identidad</Label>
              <p className="text-xs text-muted-foreground">
                Esta foto se usará para verificar tu identidad en el estadio. Asegúrate de que sea clara y nítida.
              </p>

              {formData.photoBase64 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img
                      src={formData.photoBase64}
                      alt="Selfie tomada"
                      className="h-64 w-48 rounded-lg object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, photoBase64: '' }))}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-2 text-destructive-foreground"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-green-600 font-medium">✓ Foto tomada correctamente</p>
                </div>
              ) : (
                <SelfieCapture
                  onCapture={(base64) => setFormData(prev => ({ ...prev, photoBase64: base64 }))}
                  onError={(msg) => setError(msg)}
                />
              )}

              <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                <p className="font-medium">Requisitos para la foto:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>Cara visible y sin obstrucciones</li>
                  <li>Buena iluminación (evita contraluz)</li>
                  <li>Expresión neutral</li>
                  <li>Sin lentes de sol ni sombreros</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Equipos favoritos (0-5)</Label>
              {isLoadingTeams ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teams.map(team => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => toggleTeam(team.id)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm transition-colors",
                        formData.teamsIds.includes(team.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      )}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.teamsIds.length}/5 equipos seleccionados
              </p>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.consents.terms}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      consents: { ...prev.consents, terms: !!checked }
                    }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  Acepto los términos y condiciones
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="lgpd"
                  checked={formData.consents.lgpd}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      consents: { ...prev.consents, lgpd: !!checked }
                    }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="lgpd" className="text-sm font-normal cursor-pointer">
                  Acepto la política de privacidad (Ley 19.628)
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="photoUsage"
                  checked={formData.consents.photoUsage}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      consents: { ...prev.consents, photoUsage: !!checked }
                    }))
                  }
                  className="mt-1"
                />
                <Label htmlFor="photoUsage" className="text-sm font-normal cursor-pointer">
                  Autorizo el uso de mi fotografía para verificación de identidad
                </Label>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">RUT:</span>
                <span className="font-medium">{formData.rut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">+569{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipos:</span>
                <span className="font-medium">
                  {formData.teamsIds.length > 0
                    ? formData.teamsIds.length
                    : 'Ninguno'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consentimientos:</span>
                <span className="font-medium text-green-600">
                  {formData.consents.lgpd && formData.consents.terms && formData.consents.photoUsage
                    ? '✓ Aceptados'
                    : '✗ Pendientes'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Al hacer clic en "Registrarse", se creará tu cuenta y recibirás un código de verificación por WhatsApp.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/50">
      <header className="bg-primary px-4 py-6">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="rounded-full bg-primary-foreground p-2">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-semibold text-primary-foreground">App Socios</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Paso {step} de 7</span>
              <span>{Math.round((step / 7) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{STEPS[step - 1].title}</CardTitle>
              <CardDescription>
                {step < 7 ? 'Completa la información para continuar' : 'Revisa tus datos antes de enviar'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {renderStepContent()}

              <div className="mt-6 flex gap-3">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Atrás
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step === 7 ? (
                    <>
                      Registrarse <Check className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continuar <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {step < 7 && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Una vez avanzado, no podrás volver atrás
            </p>
          )}
        </div>
      </main>
    </div>
  )
}