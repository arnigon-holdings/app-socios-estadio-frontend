import { useState, useCallback } from 'react'
import { FaceLivenessDetector, type ErrorState } from '@aws-amplify/ui-react-liveness'
import { Shield, Camera, Sun, Sparkles, AlertCircle, RefreshCw, X, Loader2 } from 'lucide-react'
import { createLogger } from '@/lib/logger'

interface LivenessError {
  state: ErrorState
  error: Error
}

interface DeviceInfo {
  deviceId: string
  groupId: string
  label: string
}

const FACE_LIVENESS_API_URL = import.meta.env.VITE_FACE_LIVENESS_API_URL || ''
const FACE_LIVENESS_API_KEY = import.meta.env.VITE_FACE_LIVENESS_API_KEY || ''

const log = createLogger('face-liveness')

export interface FaceLivenessProps {
  onSuccess: (result: {
    confidence: number
    referenceImage: string
    sessionId: string
    auditImages: string[]
  }) => void
  onCancel: () => void
}

interface SessionResult {
  sessionId: string
  status: string
  confidence: number
  referenceImage: string
  auditImages: Array<{ index: number; bytes: string }>
}

function maskApiKey(key: string): string {
  if (!key) return '<empty>'
  if (key.length <= 8) return '***'
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

const REQUIREMENTS = [
  { icon: Camera, label: 'Centra tu cara en el óvalo' },
  { icon: Sun, label: 'Buena iluminación frontal' },
  { icon: Shield, label: 'Sin lentes, gorros o máscaras' },
] as const

function mapErrorToCopy(message: string): { title: string; description: string } {
  const lower = message.toLowerCase()
  if (lower.includes('network') || lower.includes('fetch')) {
    return {
      title: 'Sin conexión',
      description: 'No pudimos conectar con el servicio. Verifica tu internet e intenta de nuevo.',
    }
  }
  if (lower.includes('camera') || lower.includes('permission') || lower.includes('notallowed')) {
    return {
      title: 'Cámara bloqueada',
      description: 'Necesitamos acceso a tu cámara. Habilítala en los permisos del navegador e intenta de nuevo.',
    }
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return {
      title: 'Tiempo agotado',
      description: 'La verificación tardó demasiado. Inténtalo de nuevo en un lugar con mejor conexión.',
    }
  }
  if (lower.includes('not supported') || lower.includes('notsupported')) {
    return {
      title: 'Navegador no compatible',
      description: 'Tu navegador no soporta verificación facial. Usa Chrome, Safari o Firefox actualizados.',
    }
  }
  return {
    title: 'No pudimos verificarte',
    description: 'Ocurrió un problema durante la verificación. Inténtalo de nuevo.',
  }
}

export function FaceLiveness({ onSuccess, onCancel }: FaceLivenessProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSession = useCallback(async (): Promise<string> => {
    const url = `${FACE_LIVENESS_API_URL}/face-liveness/sessions`
    log.info('createSession:start', { url, method: 'POST', apiKey: maskApiKey(FACE_LIVENESS_API_KEY) })

    const t0 = performance.now()
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': FACE_LIVENESS_API_KEY,
        },
      })
    } catch (networkErr) {
      const message = networkErr instanceof Error ? networkErr.message : String(networkErr)
      log.error('createSession:network_error', {
        url,
        error: message,
        durationMs: Math.round(performance.now() - t0),
      })
      throw new Error(`Network error creating session: ${message}`, { cause: networkErr })
    }

    const durationMs = Math.round(performance.now() - t0)

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Failed to create session' }))
      const message = Array.isArray(errBody.error) ? errBody.error.join(', ') : errBody.error
      log.error('createSession:http_error', {
        url,
        status: response.status,
        statusText: response.statusText,
        body: errBody,
        durationMs,
      })
      throw new Error(message)
    }

    const data = await response.json()
    log.info('createSession:success', {
      sessionId: data.sessionId,
      status: response.status,
      durationMs,
    })
    return data.sessionId
  }, [])

  const getSessionResults = useCallback(async (sid: string): Promise<SessionResult> => {
    const url = `${FACE_LIVENESS_API_URL}/face-liveness/sessions/${sid}/results`
    log.info('getSessionResults:start', { url, sessionId: sid, method: 'GET' })

    const t0 = performance.now()
    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': FACE_LIVENESS_API_KEY,
        },
      })
    } catch (networkErr) {
      const message = networkErr instanceof Error ? networkErr.message : String(networkErr)
      log.error('getSessionResults:network_error', {
        url,
        sessionId: sid,
        error: message,
        durationMs: Math.round(performance.now() - t0),
      })
      throw new Error(`Network error fetching results: ${message}`, { cause: networkErr })
    }

    const durationMs = Math.round(performance.now() - t0)

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Failed to get results' }))
      const message = Array.isArray(errBody.error) ? errBody.error.join(', ') : errBody.error
      log.error('getSessionResults:http_error', {
        url,
        sessionId: sid,
        status: response.status,
        statusText: response.statusText,
        body: errBody,
        durationMs,
      })
      throw new Error(message)
    }

    const data = await response.json()
    const result: SessionResult = {
      sessionId: data.sessionId,
      status: data.status,
      confidence: data.confidence,
      referenceImage: data.referenceImage?.bytes || '',
      auditImages: data.auditImages || [],
    }
    log.info('getSessionResults:success', {
      sessionId: sid,
      status: result.status,
      confidence: result.confidence,
      hasReferenceImage: result.referenceImage.length > 0,
      auditImagesCount: result.auditImages.length,
      durationMs,
    })
    return result
  }, [])

  const handleStart = useCallback(async () => {
    log.info('handleStart:click', { currentState: { isLoading, sessionId, error } })
    setIsLoading(true)
    setError(null)
    try {
      const sid = await createSession()
      log.info('handleStart:transition', { from: 'loading', to: 'streaming', sessionId: sid })
      setSessionId(sid)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar verificación'
      log.warn('handleStart:error_shown', { message, error: err })
      setError(message)
      setIsLoading(false)
    }
  }, [createSession, isLoading, sessionId, error])

  const handleAnalysisComplete = useCallback(async () => {
    log.info('handleAnalysisComplete:invoked', { sessionId })
    if (!sessionId) {
      log.warn('handleAnalysisComplete:no_sessionId', {})
      return
    }
    try {
      const results = await getSessionResults(sessionId)
      log.info('handleAnalysisComplete:success', {
        sessionId,
        confidence: results.confidence,
        status: results.status,
      })
      const auditImagesBase64 = (results.auditImages || []).map(img =>
        img.bytes ? `data:image/jpeg;base64,${img.bytes}` : ''
      ).filter(Boolean)
      onSuccess({
        confidence: results.confidence,
        referenceImage: results.referenceImage,
        sessionId: results.sessionId,
        auditImages: auditImagesBase64,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener resultados'
      log.error('handleAnalysisComplete:error', { sessionId, message, error: err })
      setError(message)
    }
  }, [sessionId, getSessionResults, onSuccess])

  const handleError = useCallback((livenessError: LivenessError, _deviceInfo?: DeviceInfo) => {
    log.error('handleError:amplify_error', {
      errorState: livenessError.state,
      errorName: livenessError.error?.name,
      errorMessage: livenessError.error?.message,
      errorStack: livenessError.error?.stack,
      currentSessionId: sessionId,
    })
    setError(livenessError.error?.message || livenessError.state || 'Error en la verificación facial')
    setSessionId(null)
    setIsLoading(false)
  }, [sessionId])

  const handleCancel = useCallback(() => {
    log.info('handleCancel:user_cancel', { sessionId })
    setSessionId(null)
    setIsLoading(false)
    setError(null)
    onCancel()
  }, [onCancel, sessionId])

  const handleRetry = useCallback(() => {
    log.info('handleRetry:click', { previousSessionId: sessionId, previousError: error })
    setSessionId(null)
    setIsLoading(false)
    setError(null)
  }, [sessionId, error])

  if (isLoading && !sessionId) {
    return (
      <div
        data-testid="liveness-loading"
        className="relative flex flex-col items-center justify-center py-12 px-4 space-y-8"
      >
        <div className="relative w-64 h-80 flex items-center justify-center">
          <div className="absolute inset-0 rounded-[50%] border-2 border-primary/20" />
          <div
            className="absolute inset-0 rounded-[50%] border-2 border-transparent border-t-primary animate-spin"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="absolute inset-2 rounded-[50%] border border-primary/30"
            style={{
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <span className="text-xs uppercase tracking-wider font-semibold text-primary/70">
              Conectando
            </span>
          </div>
        </div>
        <div className="text-center space-y-2 max-w-xs">
          <p className="text-base font-medium text-foreground">
            Preparando tu verificación
          </p>
          <p className="text-xs text-muted-foreground">
            Estamos conectando con el servicio de verificación para validar tu identidad de forma segura.
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Cancelar
        </button>
      </div>
    )
  }

  if (error && !sessionId) {
    const errorCopy = mapErrorToCopy(error)
    return (
      <div
        data-testid="liveness-error"
        className="flex flex-col items-center text-center py-8 px-4 space-y-6"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-100 animate-pulse" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center border-2 border-red-200">
            <AlertCircle className="w-10 h-10 text-red-600" strokeWidth={2.5} />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <h3 className="text-lg font-semibold text-foreground">{errorCopy.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {errorCopy.description}
          </p>
          {import.meta.env.DEV && (
            <details className="mt-3 text-left">
              <summary className="text-xs text-muted-foreground/60 cursor-pointer hover:text-muted-foreground">
                Detalle técnico
              </summary>
              <pre className="mt-2 text-[10px] text-muted-foreground/60 bg-muted/30 p-2 rounded overflow-auto max-h-24">
                {error}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-3 pt-2 w-full max-w-xs">
          <button
            onClick={handleCancel}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground bg-secondary border border-border rounded-xl hover:bg-secondary/70 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={handleRetry}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (sessionId) {
    return (
      <div className="w-full space-y-5" data-testid="liveness-validating">
        <div className="max-w-md mx-auto flex items-center justify-between px-1">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 rounded-full border border-border transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-secondary rounded-full border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            En vivo
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">
              Validando tu rostro
            </p>
            <p className="text-xs text-muted-foreground">
              Mantén tu cara en el óvalo
            </p>
          </div>
          <div className="liveness-progress-bar" />
        </div>

        <div className="max-w-md mx-auto">
          <FaceLivenessDetector
            sessionId={sessionId}
            region="us-east-1"
            disableStartScreen
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleError}
            onUserCancel={handleCancel}
          />
        </div>
      </div>
    )
  }

  return (
    <div data-testid="liveness-idle" className="flex flex-col items-center py-6 px-2 space-y-7">
      <div className="relative w-56 h-72 flex items-center justify-center">
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5" />
        <div className="absolute inset-0 rounded-[50%] border-[3px] border-dashed border-primary/40" />
        <div
          className="absolute inset-3 rounded-[50%] border-2 border-primary/60"
          style={{ animation: 'pulse 3s ease-in-out infinite' }}
        />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-primary/10 border border-primary/30" />

        <div className="relative z-10 flex flex-col items-center gap-2 mt-32">
          <div className="w-14 h-14 rounded-full bg-white shadow-lg shadow-primary/20 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-7 h-7 text-primary" strokeWidth={2.5} />
          </div>
        </div>

        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow" />
        <div className="absolute bottom-8 left-2 w-2 h-2 rounded-full bg-emerald-400/70" />
        <div className="absolute bottom-12 right-4 w-2 h-2 rounded-full bg-emerald-400/70" />
      </div>

      <div className="text-center space-y-1.5 max-w-xs">
        <h3 className="text-lg font-semibold text-foreground">Verificación facial</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vamos a confirmar que eres una persona real. Tomate unos segundos para centrar tu cara en el óvalo.
        </p>
      </div>

      <ul className="w-full max-w-xs space-y-2.5">
        {REQUIREMENTS.map(({ icon: Icon, label }, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
            </div>
            <span className="text-foreground/80">{label}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleStart}
        className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
      >
        <Camera className="w-4 h-4" />
        Iniciar verificación
      </button>
    </div>
  )
}