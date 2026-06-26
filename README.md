# `frontend/` — App Socios (registro público)

SPA React 19 + Vite 6 + Tailwind v4 + shadcn/ui. La usan los socios para registrarse y (futuro) acceder a su perfil.

> **Contexto completo para LLM/humano nuevo**: leé [`/README.md`](../../README.md), [`/AGENTS.md`](../../AGENTS.md), y [`/SPEC.md`](../../SPEC.md) primero.

## Quickstart

```bash
npm install
cp .env.example .env       # editar con credenciales reales (gitignored)
npm run dev                # http://localhost:5173
```

Build de prod:

```bash
npm run build
npm run preview
```

## Estructura

```
frontend/
├── src/
│   ├── main.tsx                  ← entrypoint + providers (Router, QueryClient, Auth)
│   ├── App.tsx                   ← rutas
│   ├── components/
│   │   ├── ui/                   ← shadcn primitives (button, card, input, ...)
│   │   ├── face-liveness.tsx     ← Amplify FaceLivenessDetector wrapper
│   │   └── selfie-capture.tsx
│   ├── pages/
│   │   ├── landing.tsx           ← /
│   │   ├── registro.tsx          ← /registro (wizard 7 pasos)
│   │   ├── registro-exito.tsx
│   │   ├── login.tsx             ← /login
│   │   ├── equipos.tsx           ← /equipos
│   │   └── dashboard.tsx         ← /app/dashboard (autenticado)
│   ├── hooks/
│   │   ├── use-auth.tsx          ← JWT context, login/logout/refresh
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── api.ts                ← fetchApi + endpoints
│   │   ├── amplify-config.ts      ← Amplify.configure con Cognito
│   │   ├── rut.ts                ← formatRUT compartido (7-9 dígitos + K)
│   │   ├── logger.ts             ← createLogger(name) → console + structured
│   │   └── utils.ts
│   ├── types/                    ← User, Team, etc
│   └── index.css                 ← Tailwind + Amplify overrides
├── terraform/                    ← Lambda + API Gateway (Face Liveness backend)
│   ├── main.tf
│   ├── modules/{cognito,iam,lambda,apigateway}/
│   └── variables.tf
├── tests/                        ← Playwright E2E
├── .env.example                  ← template tracked
└── .env                          ← (gitignored) dev secrets
```

## Endpoints que consume

- `POST http://localhost:3000/api/v1/frontend/users` — registro (foto base64, audit_images, consents).
- `GET http://localhost:3000/api/v1/teams` — equipos activos (selector en step 5 del wizard).
- `POST http://localhost:3000/api/v1/auth/login` — login socio.
- `POST /api/v1/auth/refresh` — refresh token.
- `GET http://localhost:3000/api/v1/me` — perfil actual.
- `GET /face-liveness/...` (Vite dev proxy → AWS API Gateway) — FaceLiveness create-session + get-results.

## Wizard de registro (7 pasos)

| # | Paso | Validación |
|---|---|---|
| 1 | RUT | módulo 11 (también acepta K) — helper `formatRUT` en `lib/rut.ts` |
| 2 | Teléfono + nacimiento | 8 dígitos Chile (sin +569, lo agrega) |
| 3 | Password | min 8 chars (lo hashea backend con bcrypt) |
| 4 | Foto (Face Liveness) | `disableStartScreen`, confidence oculto al usuario, progress bar custom |
| 5 | Equipos | 0-5 (selector con búsqueda) |
| 6 | Consentimientos | 3 booleanos: lgpd, terms, photo_usage (todos requeridos) |
| 7 | Confirmar | submit POST |

## Decisiones de UX importantes (ver `/CLAUDE.md` raíz para detalle)

- **Liveness auto-start**: skip pantalla intermedia de Amplify (`disableStartScreen`). Riesgo aceptado: no se ve el photosensitivity warning (mitigado con instrucciones en idle).
- **Confidence oculto al usuario**: el score de Rekognition se envía al backend para auditoría pero la UI solo muestra "Identidad verificada" o error.
- **No mostrar marcas de tecnología**: ningún mensaje dice "AWS" o "Rekognition" al usuario. Texto: "Conectando con el servicio de verificación", "Verificando tu identidad".
- **`.amplify-liveness-camera-module` override CSS**: `background-color: transparent`, `border: none`, `box-shadow: none` — el óvalo del detector queda libre sobre el card del wizard (no dentro de un rectángulo blanco).

## Comandos

```bash
npm run dev                  # vite dev server :5173
npm run build                # tsc + vite build → dist/
npm run preview              # serve dist/
npm run lint                 # eslint
npm run test                 # playwright (requiere dev servers up)
npm run test:ui              # playwright con UI
```

## Env vars

`VITE_*` (expuestas al bundle):

| Var | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL del backend Rails |
| `VITE_AWS_REGION` | us-east-1 |
| `VITE_FACE_LIVENESS_API_URL` | URL del API Gateway (Face Liveness) — Vite dev proxy usa esto |
| `VITE_FACE_LIVENESS_API_KEY` | API key del API Gateway (header `X-Api-Key`) |
| `VITE_COGNITO_IDENTITY_POOL_ID` | Cognito Identity Pool (Amplify SDK) |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool |
| `VITE_COGNITO_USER_POOL_CLIENT_ID` | Cognito User Pool Client |

## Gotchas

- **`VITE_FACE_LIVENESS_API_KEY` debe existir en build time**. El `vite.config.ts` lanza error si falta. Copiá `.env.example` a `.env` antes de `npm run dev`.
- **MediaDevices API** requiere HTTPS o `localhost`. `localhost` y `127.0.0.1` funcionan en HTTP. Cualquier otro host necesita TLS.
- **Amplify FaceLiveness es la única vía soportada** para hacer liveness check con Rekognition desde web. No intentés implementar el WebSocket streaming manual.
- **Bundle size ~1.5MB** (Amplify + tfjs + mediapipe suman ~800KB). Code splitting lazy en `/registro` vía `React.lazy` si te molesta el LCP.
- **Sin tests unitarios** — solo E2E Playwright. Tests E2E mockean liveness con `--use-fake-ui-for-media-stream` (Playwright config).
- **Liveness no testeable en E2E** (requiere cámara real + sesión AWS). Los tests cubren hasta el paso 4 con mock.

## Decisiones arquitectónicas

- **`formatRUT` compartido** entre `registro` y `login` (`src/lib/rut.ts`). DRY. Acepta cuerpo de 7-9 dígitos + DV numérico o K. `maxLength: 10`.
- **Sin estado global** (Redux/Zustand). El form vive en `useState` local de `registro.tsx`. Auth en Context (`use-auth.tsx`).
- **Sin SSR**. SPA pura. React Router v7 client-side.
- **TanStack Query** para `/me`, `/teams`. No usar para el submit del registro (one-shot).
- **`canvas-confetti`** en éxito de registro (refuerzo positivo).
