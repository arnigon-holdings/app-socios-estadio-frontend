# Agent Guide - App Perfilamiento

## Proyecto
App de perfilamiento para seguridad de estadio (socios). React 19 + Vite + Tailwind CSS v4.

## Stack Principal
- **Framework:** React 19 + Vite
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4 + shadcn/ui (custom, no CLI)
- **Validación:** Zod + React Hook Form
- **Icons:** Lucide React
- **Confetti:** canvas-confetti
- **HTTP:** fetch directo (no axios)
- **API client:** `src/lib/api.ts` - patrón simple con `fetchApi<T>(endpoint, options)`
- **Backend (futuro):** Rails API en `/api/v1/*` (a integrar después de validar liveness)
- **Liveness:** AWS Amplify `FaceLivenessDetector` + API Gateway + Lambda (Terraform)

## Estructura de Archivos Clave

```
src/
├── components/
│   ├── ui/                  # Componentes shadcn/ui (alert, button, card, checkbox, input, label)
│   ├── face-liveness.tsx    # Único componente de verificación facial (Amplify SDK)
│   └── selfie-capture.tsx   # Legacy - captura simple, NO se usa en registro
├── hooks/
│   └── use-auth.tsx         # Auth context provider
├── lib/
│   ├── api.ts               # Cliente API (get, post, patch, delete)
│   └── utils.ts             # cn() helper
├── pages/
│   ├── landing.tsx          # Landing con 6 beneficios
│   ├── registro.tsx         # Wizard 7 pasos (paso 4 = FaceLiveness)
│   ├── registro-exito.tsx
│   ├── login.tsx
│   ├── dashboard.tsx
│   └── equipos.tsx
├── routes/
│   └── index.tsx            # Router con PublicRoute/ProtectedRoute
└── types/
    └── index.ts             # Team interface
```

## Rutas
| Ruta | Descripción | Auth |
|------|-------------|------|
| `/` | Landing page | No |
| `/registro` | Wizard 7 pasos | No (PublicRoute) |
| `/registro/exito` | Post registro | No |
| `/login` | Login | No (PublicRoute) |
| `/app/dashboard` | Dashboard | Sí (ProtectedRoute) |
| `/app/equipos` | Gestión equipos | Sí |

## Flujo de Registro (Wizard 7 Pasos)

1. **Identificación**: RUT con validación (algoritmo módulo 11)
2. **Contacto**: Teléfono (+569) + fecha nacimiento
3. **Seguridad**: Contraseña (mín 8 chars)
4. **Verificación de identidad**: **FaceLiveness** (paso 4 del wizard)
   - Llama `POST /face-liveness/sessions` → `sessionId`
   - `FaceLivenessDetector` (Amplify) hace el streaming a Rekognition
   - Al completar → `GET /face-liveness/sessions/{id}/results` → `confidence`, `referenceImage`, `auditImages`
   - `onSuccess` → `registro.tsx` guarda `photoBase64`, `livenessSessionId`, `livenessConfidence`
   - Si falla → reintentar
   - Si cancela → `navigate('/')`
5. **Equipos**: Seleccionar 0-5 equipos favoritos
6. **Términos**: 3 checkboxes (términos, LGPD, uso de foto)
7. **Confirmar**: Resumen → POST `/api/v1/users`
   - Si RUT y teléfono válidos → confetti → `/registro/exito`

## Face Liveness - Detalles de Implementación

### Endpoints de API (Terraform despliega estos)
- `POST /face-liveness/sessions` → Lambda `create_face_liveness_session` → `{ sessionId, signedWebSocketUrl }`
- `GET /face-liveness/sessions/{sessionId}/results` → Lambda `get_face_liveness_session_results` → `{ confidence, referenceImage, auditImages, status }`

En desarrollo, Vite proxy plugin (`vite.config.ts`) intercepta `/face-liveness/*` y reenvía a API Gateway real con la API Key.

### Variables de Entorno
```env
VITE_FACE_LIVENESS_API_URL=   # Opcional. Vacío = usar path relativo (vía Vite proxy)
VITE_FACE_LIVENESS_API_KEY=   # Solo si se llama API Gateway directo sin proxy
```

### Flujo Técnico (real, no custom WebSocket)
1. React: `POST /face-liveness/sessions` (vía Vite proxy → API Gateway → Lambda)
2. Lambda crea sesión AWS Rekognition → devuelve `{ sessionId, signedWebSocketUrl }`
3. React pasa `sessionId` a `<FaceLivenessDetector sessionId={sessionId}>`
4. **El SDK de Amplify maneja el WebSocket directo a `wss://rekognition-streaming.us-east-1.amazonaws.com` usando `signedWebSocketUrl`. No requiere relay, no requiere credenciales AWS en el browser.**
5. Al terminar el challenge, React: `GET /face-liveness/sessions/{id}/results` → confidence + referenceImage + auditImages

### ⚠️ Lo que NO existe (borrar de la cabeza)
- No hay relay-service. (`relay-service/` fue eliminado — Amplify SDK maneja streaming directo)
- No hay `useFaceLiveness` custom. (hook eliminado — Amplify component maneja el state machine)
- No hay `face-liveness-ui.tsx` custom. (componente custom eliminado)
- No hay WebSocket manual desde el frontend. (Amplify SDK lo hace internamente)

### Estados del componente
Los maneja Amplify `FaceLivenessDetector` internamente. Desde fuera solo vemos:
- `idle` (antes de click "Iniciar verificación")
- `loading` (POST a /sessions en curso)
- `streaming` (FaceLivenessDetector activo, grabando)
- `success` (mostrar confidence + referenceImage)
- `error` (mostrar mensaje + botones Retry/Cancel)

## Validation Workflow

**Regla**: un item del checklist NO se marca como hecho sin test verde.

Cuando implementes un cambio:
1. Lee el archivo completo antes de editar
2. Implementa el cambio mínimo
3. Corre `npm run lint` + `npm run build`
4. Si agregaste comportamiento nuevo, agrega/actualiza test en `tests/liveness/`
5. Corre `npx playwright test`
6. Si todo verde, marca en `checklist.md`: `[x] ✅ YYYY-MM-DD — <descripción>`
7. Commit

**Si tocas infra (Terraform)**:
```bash
cd terraform
terraform plan -var-file=...
terraform apply
```
Y valida con `curl` antes de marcar.

## Comandos
```bash
npm run dev              # Desarrollo (puerto 5174)
npm run build            # Build producción
npm run lint             # Linting
npm run preview          # Preview en puerto 4173
npx playwright test      # Tests E2E
lsof -i :5174            # Verificar Vite arriba
```

## Dependencias Clave (package.json)
```json
"@aws-amplify/ui-react-liveness": "^3.x"  // FaceLivenessDetector
"@aws-sdk/client-rekognition": "^3.x"     // AWS SDK (instalado, uso futuro)
"@tanstack/react-query": "^5.x"
"canvas-confetti": "^1.9.x"
"lucide-react": "^1.21.x"
"react-hook-form": "^7.x"
"zod": "^4.x"
"@hookform/resolvers": "^5.x"
```

## Si Necesitas Modificar...

### Agregar un nuevo step al wizard de registro
1. Agregar entrada en `const STEPS = [...]` en `src/pages/registro.tsx`
2. Agregar case en `renderStepContent()` con el formulario
3. Agregar validación en `handleNext()` para el step
4. Actualizar `max={7}` y `step / 7 * 100` progress bar

### Cambiar el diseño de la landing page
- Editar `src/pages/landing.tsx`
- Grid de beneficios: `md:grid-cols-2 lg:grid-cols-4` con `max-w-6xl` (esto limita a 2 cols en desktop por el max-width)

### Modificar API calls
- Editar `src/lib/api.ts` - el cliente fetch simple
- Los endpoints están en `VITE_API_BASE_URL`

### Agregar Face Liveness a otro flujo
```tsx
import { FaceLiveness } from '@/components/face-liveness'

<FaceLiveness
  onSuccess={({ referenceImage, sessionId, confidence }) => {
    // referenceImage = base64 JPEG (sin prefix)
    // confidence = 0-100
    // sessionId = AWS session ID
  }}
  onCancel={() => { /* user abandonó */ }}
/>
```

### Actualizar variables de Terraform
- Ubicación: `terraform/variables.tf`
- Para aplicar cambios:
  ```bash
  cd terraform
  terraform plan -var="variable=valor"
  terraform apply -var="variable=valor"
  ```

## Errores Comunes

### `ERR_CONNECTION_REFUSED` en `localhost:5174`
**Causa**: Vite no está corriendo.
**Fix**: `npm run dev` en otra terminal.

### `404` en `/face-liveness/sessions`
**Causa 1**: Vite proxy plugin no cargó → Vite no estaba arriba.
**Causa 2**: Variable `VITE_FACE_LIVENESS_API_URL` apunta a URL inválida.
**Fix**: Verificar `.env`, reiniciar Vite.

### `403 Forbidden` de API Gateway
**Causa**: API Key incorrecta o falta el header `X-Api-Key`.
**Fix**: Verificar `.env`, `vite.config.ts` línea 19.

### "Permiso de cámara denegado"
**Causa**: Browser requiere HTTPS (excepto localhost) + el usuario rechazó el prompt.
**Fix**: En producción usar HTTPS; en dev usar `localhost` o `127.0.0.1`.

### Doble `/face-liveness/face-liveness` en URL
**Causa**: Bug histórico en `face-liveness.tsx:15` (default `'/face-liveness'`).
**Fix**: Default `''`, no tocar. Si vuelve a aparecer, revisar el template literal.

## Contacto / Seguir Implementación
- `checklist.md` — tareas pendientes y validación
- `CONTEXTO.md` — estado actualizado del proyecto