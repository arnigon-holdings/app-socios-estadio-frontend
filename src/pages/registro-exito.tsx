import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function RegistroExitoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">¡Registro exitoso!</CardTitle>
          <CardDescription>
            Tu cuenta ha sido creada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <MessageCircle className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Recibirás un código de verificación por WhatsApp para confirmar tu número de teléfono.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Una vez verificado tu teléfono, podrás acceder a tu perfil y comenzar a acumular puntos.
          </p>

          <Button asChild className="w-full">
            <Link to="/login">Ir a iniciar sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}