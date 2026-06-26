import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, ChevronRight, ChevronLeft, Shield, User, Phone, Lock, Camera, Users, FileText, Sparkles, Mail, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { formatRUT, RUT_MAX_LENGTH } from '@/lib/rut'
import { FaceLiveness } from '@/components/face-liveness'
import type { Team, FaceMatch } from '@/types'

function validarRUT(rut: string): boolean {
  const cleaned = rut.replace(/[^0-9Kk]/g, '')
  if (cleaned.length < 8 || cleaned.length > 10) return false

  const dv = cleaned.slice(-1).toUpperCase()
  if (!/[0-9K]/.test(dv)) return false

  const body = cleaned.slice(0, -1)
  if (!/^\d+$/.test(body)) return false

  return true
}

const STEPS = [
  { id: 1, title: 'Identificación', icon: User, color: 'bg-blue-100 text-blue-600' },
  { id: 2, title: 'Contacto', icon: Phone, color: 'bg-cyan-100 text-cyan-600' },
  { id: 3, title: 'Seguridad', icon: Lock, color: 'bg-violet-100 text-violet-600' },
  { id: 4, title: 'Tu Foto', icon: Camera, color: 'bg-pink-100 text-pink-600' },
  { id: 5, title: 'Equipos', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
  { id: 6, title: 'Términos', icon: FileText, color: 'bg-amber-100 text-amber-600' },
  { id: 7, title: 'Confirmar', icon: Sparkles, color: 'bg-primary text-white' },
]

interface FormData {
  rut: string
  phone: string
  password: string
  birthMonth: number
  birthYear: number
  photoBase64: string
  auditImages: string[]
  livenessSessionId: string
  livenessConfidence: number
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
  const [isCheckingFace, setIsCheckingFace] = useState(false)
  const [error, setError] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [duplicateFace, setDuplicateFace] = useState<FaceMatch | null>(null)
  const [formData, setFormData] = useState<FormData>({
    rut: '',
    phone: '',
    password: '',
    birthMonth: 1,
    birthYear: 1990,
    photoBase64: '',
    auditImages: [],
    livenessSessionId: '',
    livenessConfidence: 0,
    teamsIds: [],
    consents: {
      lgpd: false,
      terms: false,
      photoUsage: false,
    },
  })

  const loadTeams = async () => {
    if (teams.length > 0) return
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

  const checkDuplicateFace = async (referenceImageBase64: string) => {
    if (!referenceImageBase64) return
    setIsCheckingFace(true)
    try {
      const result = await api.searchFace<{ matches: FaceMatch[] }>(
        `data:image/jpeg;base64,${referenceImageBase64}`
      )
      if (result.matches && result.matches.length > 0) {
        setDuplicateFace(result.matches[0])
      }
    } catch {
      setDuplicateFace(null)
    } finally {
      setIsCheckingFace(false)
    }
  }

  const resetLiveness = () => {
    setFormData(prev => ({
      ...prev,
      photoBase64: '',
      auditImages: [],
      livenessSessionId: '',
      livenessConfidence: 0,
    }))
    setDuplicateFace(null)
    setError('')
  }

  useEffect(() => {
    if (step === 5) {
      loadTeams()
    }
  }, [step])

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
      const rutFormatted = formatRUT(cleanedRut)
      const phoneDigits = formData.phone.replace(/\D/g, '')
      const isPhoneValid = phoneDigits.length === 8
      const isRutValid = validarRUT(cleanedRut)

      const photo = formData.photoBase64.startsWith('data:image/')
        ? formData.photoBase64
        : `data:image/jpeg;base64,${formData.photoBase64}`

      await api.post('/api/v1/frontend/users', {
        rut: rutFormatted,
        phone: `+569${phoneDigits}`,
        password: formData.password,
        birth_month: formData.birthMonth,
        birth_year: formData.birthYear,
        photo,
        audit_images: formData.auditImages,
        liveness_session_id: formData.livenessSessionId,
        liveness_confidence: formData.livenessConfidence,
        teams_ids: formData.teamsIds,
        consents: {
          lgpd: formData.consents.lgpd,
          terms: formData.consents.terms,
          photo_usage: formData.consents.photoUsage,
        },
      })

      if (isRutValid && isPhoneValid) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        })
      }

      setTimeout(() => {
        navigate('/registro/exito')
      }, isRutValid && isPhoneValid ? 1500 : 0)
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

  const StepIcon = STEPS[step - 1].icon

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rut" className="text-sm font-medium text-foreground">RUT</Label>
              <Input
                id="rut"
                type="text"
                placeholder="12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: formatRUT(e.target.value) }))}
                maxLength={RUT_MAX_LENGTH}
                className="h-12 text-base bg-secondary/50 border-border"
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
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">Teléfono móvil</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-lg">+569</span>
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
                  className="h-12 text-base bg-secondary/50 border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa los 8 dígitos de tu número celular
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthMonth" className="text-sm font-medium text-foreground">Mes de nacimiento</Label>
                <select
                  id="birthMonth"
                  value={formData.birthMonth}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthMonth: parseInt(e.target.value) }))}
                  className="flex h-12 w-full rounded-lg border border-border bg-secondary/50 px-3 text-base"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthYear" className="text-sm font-medium text-foreground">Año de nacimiento</Label>
                <select
                  id="birthYear"
                  value={formData.birthYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthYear: parseInt(e.target.value) }))}
                  className="flex h-12 w-full rounded-lg border border-border bg-secondary/50 px-3 text-base"
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
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={8}
                className="h-12 text-base bg-secondary/50 border-border"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres
              </p>
            </div>

            <div className="rounded-xl bg-secondary/50 p-4 border border-border">
              <p className="text-sm font-medium mb-2 text-muted-foreground">Recomendaciones:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", formData.password.length >= 8 ? "bg-emerald-500" : "bg-muted-foreground")} />
                  Al menos 8 caracteres
                </li>
                <li className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", /\d/.test(formData.password) ? "bg-emerald-500" : "bg-muted-foreground")} />
                  Incluye números
                </li>
                <li className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", /[A-Z]/.test(formData.password) ? "bg-emerald-500" : "bg-muted-foreground")} />
                  Incluye mayúsculas
                </li>
              </ul>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            {duplicateFace ? (
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-red-100 animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center border-2 border-red-200">
                    <AlertCircle className="w-10 h-10 text-red-600" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <h3 className="text-lg font-semibold text-foreground">
                    Esta cara ya fue registrada
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Detectamos que este rostro ya fue utilizado para crear una cuenta.
                    Por seguridad, no es posible registrarlo nuevamente.
                  </p>
                </div>

                <div className="w-full max-w-xs rounded-xl bg-secondary/50 border border-border p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    ¿Crees que es un error?
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Contáctanos en{' '}
                    <a
                      href="mailto:soporte@arnigon.com"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      soporte@arnigon.com
                    </a>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="h-12 px-6 border-border"
                >
                  Volver al inicio
                </Button>
              </div>
            ) : formData.photoBase64 ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="relative">
                    <img
                      src={formData.photoBase64}
                      alt="Selfie verificada"
                      className="h-72 w-56 rounded-2xl object-cover border-2 border-emerald-500 card-shadow"
                    />
                    <button
                      type="button"
                      onClick={resetLiveness}
                      className="absolute -top-3 -right-3 rounded-full bg-destructive p-2 text-destructive-foreground shadow-lg hover:bg-destructive/90 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  {isCheckingFace ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Verificando disponibilidad…</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Identidad verificada</span>
                    </div>
                  )}
                </div>
              ) : (
                <FaceLiveness
                  onSuccess={({ referenceImage, sessionId, confidence, auditImages }) => {
                    const photoUrl = referenceImage
                      ? `data:image/jpeg;base64,${referenceImage}`
                      : ''
                    setFormData(prev => ({
                      ...prev,
                      photoBase64: photoUrl,
                      auditImages: auditImages || [],
                      livenessSessionId: sessionId,
                      livenessConfidence: confidence,
                    }))
                    setError('')
                    if (referenceImage) {
                      void checkDuplicateFace(referenceImage)
                    }
                  }}
                  onCancel={() => {
                    navigate('/')
                  }}
                />
              )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Equipos favoritos (0-5)</Label>
              {isLoadingTeams ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {teams.map(team => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => toggleTeam(team.id)}
                      className={cn(
                        "rounded-full px-5 py-2.5 text-sm font-medium transition-all",
                        formData.teamsIds.includes(team.id)
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                      )}
                    >
                      {formData.teamsIds.includes(team.id) && <Check className="inline h-3 w-3 mr-1.5" />}
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
              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Checkbox
                  id="terms"
                  checked={formData.consents.terms}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      consents: { ...prev.consents, terms: !!checked }
                    }))
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                  Acepto los términos y condiciones de la app
                </Label>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Checkbox
                  id="lgpd"
                  checked={formData.consents.lgpd}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      consents: { ...prev.consents, lgpd: !!checked }
                    }))
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="lgpd" className="text-sm font-normal cursor-pointer leading-relaxed">
                  Acepto la política de privacidad (Ley 19.628) para el tratamiento de mis datos personales
                </Label>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Checkbox
                  id="photoUsage"
                  checked={formData.consents.photoUsage}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({
                      ...prev,
                      consents: { ...prev.consents, photoUsage: !!checked }
                    }))
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="photoUsage" className="text-sm font-normal cursor-pointer leading-relaxed">
                  Autorizo el uso de mi fotografía para verificación de identidad en el estadio
                </Label>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/50 p-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">RUT:</span>
                <span className="font-semibold">{formData.rut}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Teléfono:</span>
                <span className="font-semibold">+569{formData.phone}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground text-sm">Equipos:</span>
                <span className="font-semibold">
                  {formData.teamsIds.length > 0
                    ? `${formData.teamsIds.length} equipo${formData.teamsIds.length !== 1 ? 's' : ''}`
                    : 'Ninguno'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground text-sm">Consentimientos:</span>
                <span className={formData.consents.lgpd && formData.consents.terms && formData.consents.photoUsage ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                  {formData.consents.lgpd && formData.consents.terms && formData.consents.photoUsage ? '✓ Aceptados' : '✗ Pendientes'}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Al registrarte, recibirás un código de verificación por WhatsApp para activar tu cuenta.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/3 bg-gradient-to-br from-primary to-blue-700 items-center justify-center p-12">
        <div className="max-w-xs text-white">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-8 backdrop-blur-sm">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Crea tu cuenta</h2>
          <p className="text-white/80 leading-relaxed">
            Regístrate una vez, verifica tu identidad y accede a todos los eventos con tu código QR personal.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Check className="h-4 w-4" />
              Verificación segura
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Check className="h-4 w-4" />
              Sin costo
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Check className="h-4 w-4" />
              En 2 minutos
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-foreground">App Socios</span>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>Paso {step} de 7</span>
                <span className="font-medium text-primary">{Math.round((step / 7) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", STEPS[step - 1].color)}>
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{STEPS[step - 1].title}</h2>
                <p className="text-sm text-muted-foreground">
                  {step < 7 ? 'Completa la información para continuar' : 'Revisa tus datos antes de enviar'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 card-shadow mb-6">
              {error && (
                <Alert variant="destructive" className="mb-5 animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {renderStepContent()}

              <div className="mt-8 flex gap-3">
                {step > 1 && !duplicateFace && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="h-12 px-6 border-border"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Atrás
                  </Button>
                )}
                {!duplicateFace && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading || isCheckingFace || (step === 4 && !formData.photoBase64)}
                    className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading || isCheckingFace ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : step === 7 ? (
                      <>
                        Registrarse
                        <Check className="ml-2 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        Continuar
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {step < 7 && (
              <p className="text-center text-xs text-muted-foreground/70">
                Una vez avanzado, no podrás volver atrás
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}