import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Shield, Users, Star, CheckCircle2, Sparkles, ArrowRight, Percent, Vote, ShoppingBag } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate('/app/dashboard', { replace: true })
      } else {
        setIsVisible(true)
      }
    }
  }, [isAuthenticated, isLoading, navigate])

  const features = [
    {
      icon: Shield,
      title: 'Verificación Segura',
      description: 'Confirmamos tu identidad con selfie biométrica para garantizar accesos seguros al estadio',
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Star,
      title: 'Puntos y Recompensas',
      description: 'Accumula puntos por cada evento al que asistas y canjéalos por beneficios exclusivos',
      color: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      icon: Percent,
      title: 'Descuentos Exclusivos',
      description: 'Obtén descuentos especiales en boletería, merch y productos oficiales de tu club',
      color: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
    {
      icon: ShoppingBag,
      title: 'Tienda Preferente',
      description: 'Accede a productos exclusivos y ediciones limitadas antes que nadie',
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: Vote,
      title: 'Vota por Formaciones',
      description: 'Da tu opinión y ayuda a decidir alineaciones, canciones del estadio y más',
      color: 'bg-cyan-50',
      iconColor: 'text-cyan-600',
    },
    {
      icon: Users,
      title: 'Tu Club, Tu Identidad',
      description: 'Selecciona hasta 5 equipos favoritos y recibe contenido y promociones personalizadas',
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  ]

  const stats = [
    { value: '+10,000', label: 'Socios registrados' },
    { value: '50+', label: 'Eventos mensuales' },
    { value: '99.9%', label: 'Tiempo activo' },
  ]

  if (!isVisible) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">App Socios</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Beneficios</a>
            <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Cómo funciona</a>
          </div>
          <button
            onClick={() => navigate('/registro')}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            Registrarse
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main>
        <section className="relative py-20 md:py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="max-w-6xl mx-auto relative">
            <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Acceso a Clubes y Beneficios</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Tu identidad,
                <br />
                <span className="text-primary">tu acceso</span>,
                <br />
                tu comunidad
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Regístrate una vez, verifica tu identidad y accede a todos los eventos de tus clubes favoritos con tu código QR personal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/registro')}
                  className="px-8 py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  Crear mi cuenta
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 rounded-xl bg-secondary text-foreground font-semibold text-base hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
                >
                  Ya tengo cuenta
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto animate-scale-in">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="py-20 px-6 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Beneficios para socios</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Todo lo que obtienes al registrarte en la plataforma
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">¿Cómo funciona?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Tres simples pasos para comenzar a vivir la experiencia
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Regístrate</h3>
                <p className="text-sm text-muted-foreground">Ingresa tu RUT, teléfono y crea una contraseña segura</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600">2</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Verifica tu identidad</h3>
                <p className="text-sm text-muted-foreground">Toma una selfie para confirmar tu identidad de forma segura</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-amber-600">3</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">¡Listo!</h3>
                <p className="text-sm text-muted-foreground">Accede al estadio con tu código QR personal</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMTJjLTIuMjA5IDAtNC0xLjc5MS00LTRzMS43OTEtOCA0LTRzNCAxLjc5MSA0IDQtMS43OTEgNC00IDR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  ¿Listo para comenzar?
                </h2>
                <p className="text-white/80 mb-8 max-w-lg mx-auto">
                  Regístrate ahora y forma parte de la nueva experiencia de acceso al estadio. Es gratis, rápido y seguro.
                </p>
                <button
                  onClick={() => navigate('/registro')}
                  className="px-10 py-4 rounded-xl bg-white text-primary font-bold text-base hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-2 mx-auto"
                >
                  Crear mi cuenta gratis
                  <ArrowRight className="h-5 w-5" />
                </button>
                <div className="flex items-center justify-center gap-8 mt-8 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Sin costo
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    En 2 minutos
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Datos seguros
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-8 px-6 border-t border-border">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">App Socios © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">Iniciar sesión</button>
              <button onClick={() => navigate('/registro')} className="hover:text-foreground transition-colors">Registrarse</button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}