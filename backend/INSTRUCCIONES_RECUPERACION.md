# 🔑 Instrucciones de Recuperación de Contraseña

## Solución 1: Script de Reseteo Directo

### Ejecutar el script para resetear la contraseña del usuario icenter_admin:

```bash
cd backend
npm run build
node dist/scripts/resetPassword.js
```

**Resultado:**
- Usuario: `icenter_admin`
- Nueva contraseña temporal: `icenter2024`
- ⚠️ **IMPORTANTE**: Cambia esta contraseña después del primer login

---

## Solución 2: Sistema de Recuperación por Email

### Nuevos endpoints disponibles:

#### 1. Solicitar recuperación de contraseña
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "contacto@icenter.ar"
}
```

**Respuesta (en desarrollo):**
```json
{
  "success": true,
  "message": "Si el email existe en nuestro sistema, recibirás un enlace de recuperación",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Resetear contraseña con token
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "newPassword": "nueva_contraseña_segura"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

## Uso Recomendado

### Para acceso inmediato:
1. Ejecuta el **Script de Reseteo Directo**
2. Usa las credenciales:
   - Usuario: `icenter_admin`
   - Contraseña: `icenter2024`

### Para implementar recuperación permanente:
1. Configura un servicio de email (SendGrid, Nodemailer, etc.)
2. Modifica el endpoint `forgot-password` para enviar emails reales
3. Crea una página web para el reseteo de contraseña

---

## Datos del Usuario

```json
{
  "_id": "68fb8a4468905e027d7e9660",
  "username": "icenter_admin",
  "email": "contacto@icenter.ar",
  "empresaId": "iCenter",
  "rol": "admin"
}
```

---

## Seguridad

- ✅ Las contraseñas se hashean con bcrypt (salt rounds: 10)
- ✅ Los tokens de recuperación expiran en 1 hora
- ✅ No se revela si un email existe en el sistema
- ✅ Los tokens incluyen timestamp para validación adicional

---

## Testing con cURL

### Solicitar recuperación:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "contacto@icenter.ar"}'
```

### Resetear contraseña:
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"resetToken": "TOKEN_AQUI", "newPassword": "nueva_contraseña"}'
```
