# CLAUDE.md — Frontend Context

> **Este archivo es el contexto de inicialización para Claude Code en el directorio `frontend/`.**
> Léeme completo al empezar una sesión. Explica **por qué** el frontend está como está.
> Si vas a proponer un cambio que contradice algo de este doc, justificarlo explícitamente.
>
> También aplica el rule **"ocultar la capa tecnológica al usuario"** definido en `/AGENTS.md` → "Regla de UX: ocultar la capa tecnológica". Ningún mensaje visible debe mencionar AWS, GCP, Rekognition u otro proveedor.

## TL;DR (60 segundos)

- **Qué es:** SPA React 19 + Vite para registro facial de socios de un estadio
- **Stack clave:** Tailwind v4 + shadcn/ui, AWS Rekognition (vía Amplify SDK) para liveness, TanStack Query para cache, Playwright para E2E
- **Backend:** Rails separado (NO en este repo). Hablamos vía `POST /api/v1/frontend/users` — contract completo en `docs/api-registro.md`
- **Feature crítica:** Face Liveness en step 4 del wizard de 7 pasos. Backend NO confía en nuestro success — re-valida con AWS
- **Decisiones UX fuertes:** auto-start liveness (skip Amplify start screen), ocultar confidence, "Continuar" disabled hasta validar, custom progress bar, NO wrapper blanco sobre el detector

---

## 1. Stack

| Tecnología | Por qué |
|------------|---------|
| **React 19 + Vite** | Vite tiene HMR <100ms, build con Rolldown rápido. React 19 da Actions/useTransition para forms. No usamos Next.js porque el backend es Rails separado (no necesitamos SSR). |
| **Tailwind CSS v4 + shadcn/ui** | Tokens semánticos (`bg-primary`, `text-muted-foreground`) en CSS variables. shadcn son componentes copiados al repo (no dep runtime) → auditables. |
| **React Router v7** | Solo necesitamos client-side routing. No usamos TanStack Router porque el surface es chico (8 rutas). |
| **React Hook Form + Zod** | Zod nos da validación tipada end-to-end. RHF evita re-renders innecesarios en inputs. |
| **TanStack Query** | Cache + retry para `/api/v1/me`, `/api/v1/teams`. No usar para el submit del registro (one-shot). |
| **canvas-confetti** | 2KB, sin deps. Dispara celebration al completar registro. |
| **lucide-react** | Tree-shakeable, mismo icon set que shadcn. |
| **@aws-amplify/ui-react-liveness** | SDK oficial para AWS Rekognition Face Liveness. WebSocket streaming + UI del challenge. Es el único path soportado para liveness con AWS. |

**Decisiones que NO tomamos:**
- ❌ Next.js / Remix → no necesitamos SSR, el SPA es suficiente
- ❌ Redux/Zustand → useState + Context alcanza. El form es el único state complejo.
- ❌ Styled Components / Emotion → Tailwind utility-first es más rápido y consistente
- ❌ Material UI / Chakra → shadcn es más liviano y customizable

---

## 2. Face Liveness — flujo y rationale

### Por qué AWS Rekognition

Requisito: validar que el usuario es una persona real (no foto/video/foto de foto). AWS Rekognition Face Liveness hace esto emitiendo un challenge de movimiento + color que es muy difícil de spoofear.

**Alternativas evaluadas y descartadas:**
- ❌ Face recognition local (face-api.js) → vulnerable a fotos impresas, sin challenge activo
- ❌ GCP Face Detection → solo detección, no liveness
- ❌ Servicios de terceros (Onfido, Jumio) → costo prohibitivo, lock-in

### Por qué el SDK de Amplify UI

El SDK de Amplify UI para React wrappea el Liveness de AWS con WebSocket streaming + estado. Alternativa: implementar raw con `@aws-sdk/client-rekognition` + WebSocket manual → demasiado trabajo para una feature estándar.

### Cómo funciona el flow (state machine)

```
idle
  ↓ click "Iniciar verificación"
loading (POST /face-liveness/sessions)
  ↓ sessionId recibido
validating (Amplify FaceLivenessDetector)
  ↓ cámara lista + challenge complete
handleAnalysisComplete (callback)
  ↓ GET /face-liveness/sessions/:id/results
onSuccess({ confidence, referenceImage, auditImages[], sessionId })
  ↓ parent setea photoBase64 + auditImages
success (parent muestra foto + ✓ Identidad verificada)
```

**Nota:** `auditImages[]` son imágenes adicionales capturadas durante el challenge (múltiples ángulos).
**Estado actual:** `auditImages` se capturan en `getSessionResults()` pero aún NO se envían al backend.
**Pendiente:** Modificar `onSuccess` para incluir `auditImages[]` y actualizar `registro.tsx` para enviarlo.

### Decisiones UX específicas

#### `disableStartScreen={true}` (auto-start)

**Problema:** Amplify por defecto muestra una pantalla intermedia con "Photosensitivity warning" + botón "Start video check" entre `initCamera` y `recording`. Esto rompe el flow: usuario hace 2 clicks en vez de 1.

**Fix:** Pasar `disableStartScreen` al `<FaceLivenessDetector>`. Esto salta el start screen y va directo a recording apenas la cámara está lista.

**Riesgo aceptado:** El usuario no ve el warning de photosensitivity antes de iniciar. Mitigamos mostrando nuestras propias instrucciones en el idle ("Buena iluminación", "Sin lentes", etc.). Si el usuario tiene epilepsia fotosensible y entra directo al challenge de colores, no tenemos cómo avisarle.

**Decisión:** Aceptamos el riesgo para privilegiar velocidad. El challenge de AWS dura ~3 segundos con colores — es tolerable. Si en el futuro hay reportes, agregamos un toggle de opt-in.

#### Confidence oculto al usuario

**Decisión de producto:** Mostrar `Confianza: 99.4%` después de validar es ruido para el usuario. Solo le importa "¿estoy validado o no?".

**Implementación:**
- El componente `FaceLiveness` sigue retornando `confidence` en `onSuccess` (lo usa el backend)
- El parent (`registro.tsx`) ya NO lo muestra en pantalla
- Backend recibe `liveness_confidence` para auditoría, no para UX

**Razonamiento:** Para un estadio donde el user quiere "validar rápido y entrar", mostrar un % de confidence es tech porn. El check verde + "Identidad verificada" cumple el rol.

#### Remover el wrapper blanco del detector

**Problema:** El wrapper `<div className="liveness-detector-wrapper">` (CSS: `bg-white`, `border`, `box-shadow`) originalmente se agregó para forzar light theme sobre Amplify (que viene con tema oscuro por default). Pero el wrapper se ve "raro" — un cuadro blanco flotando sobre fondo blanco del card del wizard.

**Fix:**
- Movimos los estilos de light theme a `.amplify-liveness-camera-module` directamente (sin wrapper)
- Reducimos `max-width` de 32rem → 28rem para que el óvalo se vea más prominente

**Trade-off:** Si en algún browser Amplify renderiza con bg oscuro sin el wrapper, lo veremos como bug visual. Aceptable porque tenemos screenshots de validación.

#### Progress bar indeterminada

Durante `validating`, mostramos una barra animada (`@keyframes liveness-progress`) con label "Validando tu rostro / Mantén tu cara en el óvalo".

**Por qué indeterminada y no con % real:** Amplify no expone un callback de progreso granular. El state machine interno va por `recording` → `uploading` → `success` pero sin timestamps. Una barra animada comunica "está pasando algo" sin mentir sobre progreso.

---

## 3. Form Wizard — diseño

### 7 pasos

| # | Paso | Validación client-side | Server-side también |
|---|------|------------------------|---------------------|
| 1 | RUT | DV check (algoritmo chileno) | ✅ backend re-valida |
| 2 | Phone + birth | 8 dígitos Chile | ✅ |
| 3 | Password | min 8 chars | ✅ |
| 4 | Foto (Face Liveness) | debe completarse | ✅ |
| 5 | Equipos | 0-5 | ✅ |
| 6 | Consentimientos | lgpd + terms + photo_usage todos true | ✅ |
| 7 | Confirmar + submit | review | POST |

### Por qué 7 pasos en vez de 1 form largo

- **Reducir fricción cognitiva**: 1 campo a la vez vs 12 campos simultáneos
- **Mejor validación progresiva**: si RUT es inválido, no avanzas ni pierdes tiempo llenando password
- **Mobile-friendly**: en 375px un form de 12 campos es ilegible

**Trade-off:** Más clicks (7 vs 1). Pero cada paso es trivial, ~3-5 segundos. Total: ~40 segundos vs un form largo que el usuario abandona.

### "Continuar" deshabilitado en step 4 hasta validar

Antes, el botón estaba enabled siempre. El usuario podía saltarse el liveness haciendo click → backend rechazaba con error genérico.

**Fix:** `disabled={isLoading || (step === 4 && !formData.photoBase64)}`. El botón se ve gris hasta que se completa el liveness.

**Bonus:** No necesitamos server-side check extra para step 4 en `handleNext` — el botón nunca se puede clickear sin foto.

### Confetti al completar

Solo se dispara si RUT y teléfono son válidos (no son inputs dummy). 150 partículas, gradiente multicolor.

**Por qué:** Refuerzo positivo + deleite. Reduce ansiedad de "¿se completó bien?". Si los datos son inválidos, no hay celebración falsa.

---

## 4. Backend integration

### Endpoint: `POST /api/v1/frontend/users`

Contract: `frontend/docs/api-registro.md` + el doc que nos pasó el equipo backend.

**Field-level notes:**

| Campo | Lo que mandamos | Por qué |
|-------|-----------------|---------|
| `rut` | `11111111-1` (con guión) | Backend exige formato con DV. Usamos `formatRUT()` que ya teníamos para el input. |
| `phone` | `+56912345678` (E.164) | Backend normaliza. Nosotros pre-formateamos para que el payload sea predecible. |
| `password` | plain text | Decisión: hash se hace en backend (bcrypt). Frontend no hashea para no confundir UX (el user ve lo que escribió). HTTPS obligatorio. |
| `birth_month` / `birth_year` | int | Defaults: enero 1990. Backend puede validar rango. |
| `photo` | `data:image/jpeg;base64,...` (con prefix) | Backend exige el prefix. Defensive check: si por algún motivo no tiene prefix, lo agregamos. |
| `liveness_session_id` | UUID de AWS | Backend re-valida con Rekognition `GetFaceLivenessSessionResults`. NO confiamos en nuestro propio success. |
| `liveness_confidence` | float 0-100 | Backend puede usar para threshold (ej: rechazar < 80%). |
| `teams_ids` | `[]` si ninguno, o array | Max 5. Backend valida que existan. |
| `consents` | 3 booleanos | Backend debe guardar timestamp + IP + UA por compliance (ley 19.628). |

### Photo: base64 vs S3 upload directo

**Decisión actual:** base64 en el payload.

**Por qué ahora:** Simple. Funciona. No necesitamos signed URLs hasta que el payload supere ~5MB.

**Cuándo cambiar:**
- Si la foto pesa > 5MB → pasar a pre-signed URL pattern
- Si mobile 3G es target → reducir tamaño antes de subir (resize client-side a 800px)

**Limitación conocida:** ~5MB base64 ≈ 3.75MB binario. La reference image de Rekognition suele ser <500KB. Estamos bien por ahora.

### Sin token de auth al registrarse

El endpoint de registro NO requiere `Authorization: Bearer ...`. El user aún no tiene cuenta. El response 201 viene con `id` y `status: "pending_verification"` — el user todavía no puede hacer login hasta que se verifique el OTP de WhatsApp (separado, fuera de scope del registro).

---

## 5. State management

### ¿Dónde vive el state?

| State | Dónde | Por qué |
|-------|-------|---------|
| Form del wizard (`formData`) | `useState` en `RegistroPage` | Solo este componente lo necesita. Si en el futuro hay multi-step con state compartido, lo movemos a Context. |
| Auth user (`useAuth`) | Context (`use-auth.tsx`) | Accedido por muchas páginas (`/app/dashboard`, `/app/equipos`). |
| Teams cache | TanStack Query | Fetch de `/api/v1/teams` se cachea 5min. Misma data en varias páginas. |
| Liveness session state | `useState` local en `FaceLiveness` | No se comparte. |

### ¿Por qué no Zustand?

Para 3 piezas de state, `useState` + Context es suficiente. Zustand suma una dep + boilerplate de stores para ganancia marginal. Si el state crece (ej: agregar perfil de usuario complejo, wizard persistente), evaluamos Zustand o Jotai.

---

## 6. Testing strategy

### Playwright (E2E)

**Ubicación:** `tests/liveness/` para los flujos específicos de face liveness, `tests/app.spec.ts` para smoke general.

**Convención:**
- Cada test navega a `/registro`, llena steps 1-3, mockea liveness, valida comportamiento
- Mocks de API via `page.route()` — no levantamos backend en tests
- Browser flags: `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` (Playwright config) para que el fake camera funcione sin permisos manuales

**Tests que SÍ tenemos (19 total en `tests/liveness/`):**
- ✅ Smoke: página carga + step 1 → 2
- ✅ Wizard step 4: idle, requirements, progress bar, validar-Continuar-disabled
- ✅ URL paths: no doble `/face-liveness/...`
- ✅ Logging: `createSession:start`, `createSession:http_error`, `createSession:network_error`, sin uncaught errors
- ✅ Capture screenshots: idle, loading, validating, error en desktop/tablet/mobile

**Tests que FALTAN (out of scope por ahora):**
- ❌ E2E happy path completo (registro → success page) — requiere mockear liveness exitoso, lo cual es no-trivial con Amplify
- ❌ Test de integración con backend real
- ❌ Visual regression tests (Playwright snapshots)

### ¿Vitest unit tests?

No tenemos. Para un frontend de este tamaño, los E2E cubren lo crítico. Unit tests de utils se pueden agregar si crece la lógica (ej: `validarRUT`, `formatRUT`).

---

## 7. Performance

### Bundle size

Actual: ~1.5MB JS minified, ~440KB gzipped. Warning de Vite a >500KB.

**De dónde viene el peso:**
- `@aws-amplify/ui-react-liveness` + `@tensorflow/tfjs` + `@mediapipe/face_detection`: ~800KB (inevitable para face detection client-side)
- React + ReactDOM: ~140KB
- Tailwind CSS: ~40KB
- El resto: ~500KB

**Mitigación:**
- Code splitting de la ruta `/registro` (lazy load el FaceLivenessDetector)
- Tree-shaking agresivo (Vite lo hace por default)
- En el futuro: CDN para Amplify si el cold start se siente lento

**No mitigamos (por ahora):**
- AMP / SSR — no aplica a SPA
- Web Workers para face detection — Amplify ya lo hace internamente

### Lighthouse targets (target, no medido)

| Metric | Target | Por qué |
|--------|--------|---------|
| FCP | < 1.5s | Above-the-fold con hero debe ser instant |
| LCP | < 2.5s | LivenessDetector es el elemento más grande |
| TTI | < 3s | User debe poder iniciar verificación rápido |
| CLS | < 0.1 | Layout estable durante el wizard |

---

## 8. Seguridad

### Decisiones tomadas

| Concern | Decisión | Por qué |
|---------|----------|---------|
| HTTPS | Requerido en prod | Password va en plain text al backend |
| CSP | Pendiente | Próxima sesión. Bloquear inline scripts, allowlists para Amplify. |
| XSS | React escapa por default | No usamos `dangerouslySetInnerHTML` en ningún lado |
| CSRF | Cookies `credentials: 'include'` en `fetchApi` | Backend debe validar CSRF token. Aún no implementado (gap conocido). |
| Password en logs | Hasheado con `bcrypt` en backend | Frontend nunca loguea password |
| Tokens | `localStorage` (no httpOnly cookies) | Más simple. Trade-off: vulnerable a XSS, mitigated by CSP futuro. |
| Photo data | Solo base64 en memoria, nunca en localStorage | Después de submit, photo viaja al backend y se olvida |

### Lo que NO hacemos (y por qué)

- ❌ Client-side password hashing (ej: bcrypt en browser) → agrega 200ms al submit por nada, backend DEBE hashear de todos modos
- ❌ Encriptar foto antes de subir → TLS del transport layer es suficiente
- ❌ Anti-tampering en form (React ya lo hace via state)

---

## 9. Limitaciones conocidas

1. **Liveness requiere HTTPS o localhost.** MediaDevices API no funciona sobre HTTP (excepto `localhost` y `127.0.0.1`). En dev está OK, en prod必须 HTTPS.

2. **Mock de liveness en tests es limitado.** No podemos simular un challenge exitoso sin una cámara real y sesión de AWS. Los tests E2E cubren hasta "click → API call enviada".

3. **Sin offline support.** Si el user pierde conexión durante el wizard, pierde lo escrito. Mitigable con `react-hook-form` persist (no implementado).

4. **Sin i18n.** Todo hardcodeado en español chileno. Si el cliente pide otro idioma, hay que refactorizar a `react-i18next`.

5. **Sin a11y audit.** Tenemos `aria-` attrs en shadcn defaults, pero no hemos hecho audit completo (axe, NVDA testing). Pendiente.

6. **Sin analytics.** No trackeamos dónde los users abandonan el wizard. PostHog / Plausible es una adición futura.

7. **Sin error tracking.** Si el liveness falla en prod, no lo sabemos hasta que el user se queje. Sentry es la adición obvia.

---

## 10. Roadmap (no comprometido)

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| Onboarding flow post-registro | Alta | Después de verificar OTP, mostrar tour del app |
| Edit profile | Media | Settings page con `/api/v1/me PATCH` |
| Biometric re-verification | Media | Re-pedir liveness si la cuenta tiene >1 año sin actividad |
| A11y audit + fixes | Media | axe-core + manual testing |
| Sentry integration | Alta | Para detectar errores en prod |
| PostHog / analytics | Media | Entender funnel del wizard |
| i18n (inglés + portugués) | Baja | Si se abre a otros mercados |
| React Native version | Baja | Si se quiere app nativa (gran esfuerzo) |

---

## 11. Cambios recientes que NO romper

Si vas a refactorizar, lee esto:

| Cambio | Archivos | Razón |
|--------|----------|-------|
| `disableStartScreen={true}` en `FaceLivenessDetector` | `src/components/face-liveness.tsx:382` | UX: skip start screen de Amplify |
| Confidence NO se muestra al usuario | `src/pages/registro.tsx` step 4 success | Decisión de UX: solo binario |
| `.liveness-detector-wrapper` removido | `src/index.css` | Light theme ahora en `.amplify-liveness-camera-module` directo |
| `Continuar` disabled en step 4 sin foto | `src/pages/registro.tsx:625` | UX: forzar liveness antes de avanzar |
| Endpoint `/api/v1/frontend/users` (no `/users`) | `src/pages/registro.tsx:188` | Contract del backend |
| RUT enviado con guión `NNNNNNNN-D` | `src/pages/registro.tsx:179` | Contract del backend |
| `data:image/jpeg;base64,...` prefix garantizado | `src/pages/registro.tsx:184-186` | Contract del backend |

---

## 12. Cómo contribuir

1. **Antes de agregar una dep nueva:** justificar en este doc. Si es >50KB o difícil de mantener, reconsiderar.
2. **Antes de cambiar un endpoint:** coordinar con backend. Actualizar `docs/api-registro.md`.
3. **Tests:** agregar Playwright test si es un flow nuevo. Si es un util, agregar Vitest.
4. **UI:** usar shadcn components primero. Custom solo si shadcn no alcanza.
5. **No agregar comentarios al código.** El código debe ser self-explanatory. Si necesita comentario, refactor.

---

## 13. Links útiles

- AWS Rekognition Face Liveness: https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html
- Amplify FaceLivenessDetector: https://ui.docs.amplify.aws/react/connected-components/liveness
- React 19 docs: https://react.dev
- Tailwind v4: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Backend contract: `frontend/docs/api-registro.md`
- Checklist de liveness: `frontend/checklist.md`
