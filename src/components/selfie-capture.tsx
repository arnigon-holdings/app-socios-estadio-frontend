import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, AlertCircle } from 'lucide-react'

interface SelfieCaptureProps {
  onCapture: (base64: string) => void
  onError: (msg: string) => void
}

export function SelfieCapture({ onCapture, onError }: SelfieCaptureProps) {
  const [hasCamera, setHasCamera] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const checkCamera = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      setHasCamera(videoDevices.length > 0)
    } catch {
      setHasCamera(false)
    }
  }, [])

  useEffect(() => {
    checkCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream, checkCamera])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al acceder a la cámara'
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setCameraError('Permiso de cámara denegado. Por favor permite el acceso a la cámara en tu navegador.')
      } else if (message.includes('NotFoundError') || message.includes('DevicesNotFoundError')) {
        setCameraError('No se encontró cámara en el dispositivo.')
      } else {
        setCameraError('No se pudo acceder a la cámara.')
      }
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    stopCamera()
    setIsCapturing(false)
    onCapture(dataUrl)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      onError('La foto debe ser menor a 5MB.')
      return
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      onError('La foto debe ser JPEG o PNG.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      onCapture(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (isCapturing && stream) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-80 w-60 rounded-lg object-cover mirror"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-white/50 rounded-lg w-48 h-64" />
          </div>
          <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs bg-black/50 py-1">
            Centra tu rostro dentro del recuadro
          </p>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { stopCamera(); setIsCapturing(false); }}
            className="bg-white/10 text-white border-white/50 hover:bg-white/20"
          >
            Cancelar
          </Button>
          <Button onClick={capturePhoto}>
            <Camera className="h-4 w-4 mr-2" />
            Capturar Selfie
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {cameraError && (
        <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="flex gap-4">
        {hasCamera ? (
          <Button onClick={() => { startCamera(); setIsCapturing(true); }} className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            Usar Cámara
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            No se detectó cámara. Usa la opción de subir foto.
          </p>
        )}

        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir Foto
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
}
