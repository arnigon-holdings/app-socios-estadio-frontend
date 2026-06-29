import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Sparkles, ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export function RegistroExitoPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-emerald-700 items-center justify-center p-12">
        <div className="max-w-md text-white text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Sparkles className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">¡Bienvenido!</h1>
          <p className="text-xl text-white/80 mb-8">
            Tu cuenta ha sido creada correctamente
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Check className="h-5 w-5" />
              <span>Verificación segura</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Check className="h-5 w-5" />
              <span>Datos protegidos</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Check className="h-5 w-5" />
              <span>Sin costo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">App Socios</span>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">¡Registro Exitoso!</h2>
            <p className="text-muted-foreground">Tu cuenta ha sido creada correctamente</p>
          </div>

          <Card className="bg-white card-shadow">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg">Próximo paso</CardTitle>
              <CardDescription>
                Verifica tu número de teléfono
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-5">
              <div className="rounded-2xl bg-secondary/50 p-6 border border-border">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Recibirás un código de verificación por <span className="font-semibold text-foreground">WhatsApp</span> para confirmar tu número de teléfono.
                </p>
              </div>

              <div className="rounded-xl bg-secondary/30 p-4 border border-border/50 text-sm text-muted-foreground">
                Una vez verificado tu teléfono, podrás acceder a tu perfil y comenzar a acumular puntos.
              </div>

              <Button asChild className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90">
                <Link to="/login">
                  Ir a iniciar sesión
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Verificado
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Seguro
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}