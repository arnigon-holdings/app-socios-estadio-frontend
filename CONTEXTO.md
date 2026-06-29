# Contexto del Proyecto - App Perfilamiento

## Estado: En desarrollo

---

## Funcionalidades Implementadas

### 1. Registro con Confetti ✅
**Archivo:** `src/pages/registro.tsx`
**Dependencias:** `canvas-confetti`, `@types/canvas-confetti`

**Comportamiento:**
- Al presionar "Registrarse" (paso 7 del wizard), si el RUT y teléfono fueron validados, se dispara confetti multicolor (150 partículas, colores: azul, verde, amarillo, rojo, violeta)
- Duración del confetti: 1.5 segundos antes de navegar a `/registro/exito`
- Si la validación falla, no hay confetti y la navegación es inmediata

**Validaciones requeridas:**
- RUT válido (función `validarRUT`)
- Teléfono con exactamente 8 dígitos

---

### 2. Landing Page - Beneficios ✅
**Archivo:** `src/pages/landing.tsx`
**Dependencias:** `lucide-react` (Percent, Vote, ShoppingBag agregados)

**Beneficios actuales (6):**
1. Verificación Segura
2. Puntos y Recompensas
3. Descuentos Exclusivos
4. Tienda Preferente
5. Vota por Formaciones
6. Tu Club, Tu Identidad

**Grid:** `md:grid-cols-2 lg:grid-cols-4` con `gap-5`
**Nota:** Por el `max-w-6xl` (720px), solo se muestran 2 columnas en desktop aunque el código indica 4.

---

## Responsiveness Check (Junio 2025)

**URL testeada:** http://localhost:4173/
**Breakpoints:** 320, 375, 768, 1024, 1280, 1440, 1920, 2560

| Check | Resultado |
|-------|-----------|
| Horizontal overflow | ✅ PASA |
| Text overflow | ✅ PASA |
| Navigation | ✅ PASA |
| Content stacking | ✅ PASA |
| Image scaling | ✅ PASA |
| Touch targets | ✅ PASA |
| Whitespace | ⚠️ MEDIA (apretado en 320px) |
| CTA visibility | ✅ PASA |

**Veredicto:** Low - Funcional en todos los breakpoints.

---

## Tareas Pendientes / Mejoras Futuras

### Alto Prioridad
- [ ] Ajustar grid de beneficios en landing para mostrar 3-4 columnas en desktop
- [ ] Verificar que el confetti funcione correctamente en producción

### Medio Prioridad
- [ ] Mejorar spacing en 320px (botones CTA apretados)
- [ ] Considerar agregar más beneficios mencionados ("más en el futuro"): participar en actividades, eventos especiales, etc.

### Bajo Prioridad / Nice-to-have
- [ ] Animaciones de transición entre pasos del wizard de registro
- [ ] Validación en tiempo real del RUT mientras se escribe

---

## Stack Tecnológico

- **Framework:** React 19 + Vite
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Validación:** Zod
- **Formularios:** React Hook Form
- **Icons:** Lucide React
- **Confetti:** canvas-confetti
- **Backend API:** `/api/v1/*` (consumido desde `src/lib/api.ts`)

---

## Variables de Entorno

```
VITE_API_URL= (definido en .env)
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview producción
npm run preview

# Linting
npm run lint

# Tests E2E
npx playwright test
```

---

## Rutas Principales

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page |
| `/registro` | Wizard de registro (7 pasos) |
| `/registro/exito` | Página de éxito post-registro |
| `/login` | Login de usuario |
| `/app/dashboard` | Dashboard (requiere auth) |
| `/app/equipos` | Gestión de equipos |

---

## Notas para Continuar

1. **Confetti:** El efecto usa `canvas-confetti` con origin `{y: 0.6}`. Si el viewport es pequeño, las partículas pueden verse cortadas en la parte inferior.

2. **Validación RUT:** La función `validarRUT` está definida en `registro.tsx` (líneas 14-35). Debería extraerse a `src/lib/utils.ts` para reutilización.

3. **Server de preview:** Para testing local, usar `npm run preview` en puerto 4173.
