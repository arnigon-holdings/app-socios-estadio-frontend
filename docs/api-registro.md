# API Contract — Registro de Usuario

> Endpoint que el frontend (React) llama al terminar el wizard de 7 pasos.
> Frontend ya mockeado y funcionando. Este doc es para que el equipo backend implemente el endpoint.

---

## Endpoint

```
POST /api/v1/frontend/users
Content-Type: application/json
```

### Request body

```json
{
  "rut": "111111111",
  "phone": "+56912345678",
  "password": "PlainTextPassword123",
  "birth_month": 5,
  "birth_year": 1995,
  "photo": "data:image/jpeg;base64,/9j/4AAQSkZ...",
  "audit_images": ["data:image/jpeg;base64,/9j/4AAQSkZ...", "data:image/jpeg;base64,..."],
  "liveness_session_id": "abc123-def456-...",
  "liveness_confidence": 99.4,
  "teams_ids": [1, 3, 7],
  "consents": {
    "lgpd": true,
    "terms": true,
    "photo_usage": true
  }
}
```

### Field spec

| Campo | Tipo | Required | Validación backend | Notas |
|-------|------|----------|---------------------|-------|
| `rut` | string | ✅ | Validar DV con algoritmo chileno. Limpiar puntos/guion antes de validar. Normalizar a `NNNNNNNN-D` con guión y DV en mayúscula. | Frontend ya envía limpio (sin puntos/guion, solo dígitos+K). Backend puede re-formatear. |
| `phone` | string | ✅ | Formato `+569XXXXXXXX` (8 dígitos después de +569). Verificar que no esté registrado. | Frontend concatena `+569` + 8 dígitos. |
| `password` | string | ✅ | Mínimo 8 caracteres. Hashear con **bcrypt cost 12** antes de persistir. NO guardar plain. | ⚠️ **Crítico**: HTTPS obligatorio. Frontend NO hashea (decisión de diseño). Backend DEBE hashear. |
| `birth_month` | int | ✅ | 1-12 | |
| `birth_year` | int | ✅ | Rango razonable, ej. 1920-2010 (usuario ≥16 años) | Frontend default 1990. |
| `photo` | string (base64) | ✅ | Decodificar y guardar en **S3**. Key: `users/{user_id}/reference.jpg`. Indexar en Rekognition Face Collection. | Tamaño típico: 100-500KB base64. |
| `audit_images` | string[] (base64) | ❌ | Decodificar y guardar en **S3**. Keys: `users/{user_id}/audit_{index}.jpg`. Indexar en Rekognition si confidence detección > 0.85. | Imágenes adicionales del liveness (múltiples ángulos). Mejora búsqueda posterior. |
| `liveness_session_id` | string | ✅ | **Re-verificar contra AWS Rekognition** llamando `GetFaceLivenessSessionResults(sessionId)`. Status debe ser `SUCCEEDED`. Si no, rechazar con 422. | Frontend NO confía en su propio success — backend re-valida. |
| `liveness_confidence` | float | ✅ | 0-100. Si backend valida `status === SUCCEEDED` puede ignorar este campo (viene de la misma API). Mantenerlo para auditoría. | |
| `teams_ids` | int[] | ❌ | Si vacío `[]`, OK. Si tiene elementos, validar que existan en DB. | Frontend permite 0-5. |
| `consents.lgpd` | bool | ✅ | true obligatorio. Guardar timestamp de aceptación. | Ley 19.628 (Chile). |
| `consents.terms` | bool | ✅ | true obligatorio. Guardar timestamp. | |
| `consents.photo_usage` | bool | ✅ | true obligatorio. Guardar timestamp. | |

### Consents: timestamp + IP

Backend debe guardar **cuándo** y **desde dónde** el usuario aceptó cada consentimiento (compliance ley 19.628). Agregar a la tabla `user_consents`:

```sql
CREATE TABLE user_consents (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  consent_type VARCHAR(50) NOT NULL,  -- 'lgpd' | 'terms' | 'photo_usage'
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

---

## Response

### Success — 201 Created

```json
{
  "id": 12345,
  "rut": "11111111-1",
  "phone": "+56912345678",
  "status": "pending_verification",
  "created_at": "2026-06-24T15:30:00Z"
}
```

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | int | ID interno del user |
| `rut` | string | RUT normalizado con guión (lo que guardaste) |
| `phone` | string | E.164 format |
| `status` | string | `pending_verification` después de creado. Cambia a `active` cuando confirme OTP de WhatsApp. |
| `created_at` | string (ISO 8601) | Timestamp |

### Frontend usage del response

Después de 201, frontend dispara confetti + navega a `/registro/exito` (no necesita más campos del response por ahora). El user_id puede guardarse en localStorage si querés tracking, pero no es bloqueante.

---

## Error responses

### 400 Bad Request — validación

```json
{
  "error": "RUT inválido",
  "field": "rut"
}
```

Frontend muestra el `error` en un Alert rojo arriba del step content.

### 409 Conflict — duplicado

```json
{
  "error": "Este RUT ya está registrado",
  "field": "rut"
}
```

### 422 Unprocessable Entity — liveness falló

```json
{
  "error": "Verificación de identidad no válida. Intenta de nuevo.",
  "field": "liveness_session_id"
}
```

⚠️ **El frontend NO debería llegar acá** porque ya validó liveness client-side. Pero si pasa (sesión expiró, AWS rechazó), mostrar error y permitir reintentar liveness.

### 500 Internal Server Error

```json
{
  "error": "Error al registrar usuario"
}
```

---

## Side effects que backend debe hacer

1. **Hashear password** con bcrypt cost 12
2. **Crear user en DB** con status `pending_verification`
3. **Guardar photo en S3** bucket privado (key: `users/{user_id}/reference.jpg`)
4. **Guardar consents** en tabla `user_consents` con timestamp + IP + UA
5. **Asignar teams** (muchos-a-muchos en `user_teams`)
6. **Disparar OTP de WhatsApp** para activar la cuenta (separado de este endpoint — usar un endpoint `/api/v1/users/:id/send-otp` o similar)
7. **Re-verificar liveness** contra AWS Rekognition. Si falla, hacer rollback del user creado (o marcar como `liveness_failed`).

---

## AWS Rekognition — flujo de validación backend

```python
import boto3

rekognition = boto3.client('rekognition', region_name='us-east-1')

def verify_liveness(session_id: str) -> dict:
    response = rekognition.get_face_liveness_session_results(SessionId=session_id)
    return {
        'status': response['Status'],           # 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
        'confidence': response.get('Confidence'),
        'reference_image_bytes': response.get('ReferenceImage', {}).get('Bytes'),
    }

# En el handler:
result = verify_liveness(request.liveness_session_id)
if result['status'] != 'SUCCEEDED':
    return error(422, "Verificación de identidad no válida")
if result['confidence'] < 80:
    return error(422, "Confianza insuficiente")
```

---

## Schema de DB sugerido

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  rut VARCHAR(12) UNIQUE NOT NULL,            -- '11111111-1'
  phone VARCHAR(20) UNIQUE NOT NULL,          -- '+56912345678'
  password_hash VARCHAR(255) NOT NULL,        -- bcrypt
  birth_month SMALLINT NOT NULL,
  birth_year SMALLINT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_verification',
  -- Liveness
  liveness_session_id VARCHAR(255),
  liveness_confidence DECIMAL(5,2),
  liveness_verified_at TIMESTAMPTZ,
  -- Photo (S3 key, no la foto en sí)
  photo_s3_key VARCHAR(500),
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_rut ON users(rut);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE teams (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  -- otros campos (logo, league, etc.)
);

CREATE TABLE user_teams (
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, team_id)
);

CREATE TABLE user_consents (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, consent_type)
);
```

---

## Tests del backend — casos a cubrir

1. ✅ Happy path: RUT válido, phone nuevo, liveness `SUCCEEDED`, 3 consents → 201
2. ❌ RUT inválido (DV mal) → 400 `field: rut`
3. ❌ Phone duplicado → 409
4. ❌ Liveness `FAILED` o `EXPIRED` → 422
5. ❌ Falta `consents.lgpd` (false) → 400 `field: consents.lgpd`
6. ❌ Password <8 chars → 400 `field: password`
7. ❌ teams_ids con team_id que no existe → 400 `field: teams_ids`
8. ✅ Re-registro con mismo RUT → 409
9. ✅ Después de 201, user está en DB con password hasheado (no plain)
10. ✅ Photo está en S3 con key correcta
11. ✅ Consents tienen timestamp + IP + UA guardados

---

## Out of scope (después)

- Login (POST /api/v1/auth/login)
- Refresh token
- Reset password
- Update profile
- Delete account
- Verificación del OTP WhatsApp
- Indexar cara en Rekognition Face Collection (para "ya está registrado" check futuro)