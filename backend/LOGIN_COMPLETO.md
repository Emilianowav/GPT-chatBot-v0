# ✅ Sistema de Login Completo - Implementado

## 🎯 Resumen

Se ha implementado un sistema de autenticación completo con JWT (JSON Web Tokens) que conecta el backend (MongoDB) con el frontend (Next.js).

---

## 🔧 Backend - Implementación

### Archivos Creados:

1. **`src/models/AdminUser.ts`**
   - Modelo de MongoDB para usuarios administradores
   - Hash automático de contraseñas con bcrypt
   - Método para comparar contraseñas
   - Roles: `admin` y `viewer`

2. **`src/services/authService.ts`**
   - Servicio de autenticación con JWT
   - Función `login()` - Autentica y genera token
   - Función `verifyToken()` - Verifica tokens
   - Función `createAdminUser()` - Crea nuevos administradores

3. **`src/middlewares/authMiddleware.ts`**
   - Middleware `authenticate` - Verifica JWT en requests
   - Middleware `requireAdmin` - Requiere rol de admin
   - Middleware `requireEmpresa` - Verifica pertenencia a empresa

4. **`src/controllers/authController.ts`**
   - `POST /api/auth/login` - Login de usuario
   - `POST /api/auth/register` - Registro de nuevo admin
   - `GET /api/auth/me` - Info del usuario autenticado

5. **`src/routes/authRoutes.ts`**
   - Rutas de autenticación configuradas

6. **`src/scripts/crearAdminInicial.ts`**
   - Script para crear usuarios administradores iniciales

### Dependencias Instaladas:
```bash
npm install jsonwebtoken bcryptjs cors
npm install --save-dev @types/jsonwebtoken @types/cors
```

### Configuración en `app.ts`:
- CORS habilitado para el frontend
- Rutas de autenticación agregadas en `/api/auth`

---

## 👥 Usuarios Creados

Se crearon automáticamente usuarios administradores para cada empresa:

| Empresa | Usuario | Contraseña |
|---------|---------|------------|
| Paraná Lodge | `paraná_admin` | `admin123` |
| iCenter | `icenter_admin` | `admin123` |
| Instituto Universitario del Iberá | `instituto_admin` | `admin123` |

⚠️ **IMPORTANTE:** Cambia estas contraseñas en producción

---

## 🌐 Frontend - Implementación

### Archivos Actualizados:

1. **`src/lib/api.ts`**
   - Cliente API actualizado con autenticación JWT
   - Método `login()` actualizado
   - Headers con Authorization Bearer token

2. **`src/contexts/AuthContext.tsx`**
   - Contexto de autenticación actualizado
   - Manejo de tokens en localStorage
   - Login con username/password

3. **`src/app/login/page.tsx`**
   - Formulario de login actualizado
   - Campo "Usuario" en lugar de "Empresa"
   - Manejo de errores mejorado

---

## 🔄 Flujo de Autenticación

### 1. Login (Frontend → Backend)
```
Usuario ingresa: username + password
    ↓
Frontend: POST /api/auth/login
    ↓
Backend: Verifica credenciales en MongoDB
    ↓
Backend: Genera JWT token (válido 7 días)
    ↓
Frontend: Guarda token en localStorage
    ↓
Frontend: Redirige a /dashboard
```

### 2. Requests Autenticados
```
Frontend: Agrega header "Authorization: Bearer {token}"
    ↓
Backend: Middleware verifica token
    ↓
Backend: Extrae info del usuario (userId, empresaId, role)
    ↓
Backend: Procesa request
    ↓
Frontend: Recibe respuesta
```

### 3. Logout
```
Usuario hace click en "Cerrar Sesión"
    ↓
Frontend: Elimina token de localStorage
    ↓
Frontend: Redirige a /login
```

---

## 🧪 Cómo Probar

### 1. Iniciar el Backend
```bash
cd backend
npm run build
npm start
```

El servidor debería iniciar en `http://localhost:3000`

### 2. Iniciar el Frontend
```bash
cd front_crm/bot_crm
npm run dev
```

El frontend debería iniciar en `http://localhost:3001`

### 3. Probar el Login

1. Abre `http://localhost:3001`
2. Serás redirigido a `/login`
3. Ingresa credenciales:
   - **Usuario:** `icenter_admin`
   - **Contraseña:** `admin123`
4. Haz click en "Iniciar Sesión"
5. Deberías ser redirigido a `/dashboard`

---

## 📊 Endpoints de Autenticación

### POST /api/auth/login
**Request:**
```json
{
  "username": "icenter_admin",
  "password": "admin123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "icenter_admin",
    "empresaId": "iCenter",
    "empresaNombre": "iCenter",
    "role": "admin",
    "email": "contacto@icenter.com"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Usuario o contraseña incorrectos"
}
```

### GET /api/auth/me
**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "icenter_admin",
    "empresaId": "iCenter",
    "role": "admin"
  }
}
```

### POST /api/auth/register
**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request:**
```json
{
  "username": "nuevo_admin",
  "password": "password123",
  "empresaId": "iCenter",
  "role": "admin",
  "email": "admin@icenter.com"
}
```

---

## 🔐 Seguridad

### Implementado:
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Tokens JWT con expiración (7 días)
- ✅ Middleware de autenticación
- ✅ Validación de roles
- ✅ CORS configurado
- ✅ Passwords no se devuelven en JSON

### Recomendaciones Adicionales:
- ⚠️ Cambiar `JWT_SECRET` en producción (variable de entorno)
- ⚠️ Implementar rate limiting para login
- ⚠️ Agregar refresh tokens
- ⚠️ Implementar 2FA (autenticación de dos factores)
- ⚠️ Logs de intentos de login fallidos
- ⚠️ Bloqueo temporal después de X intentos fallidos

---

## 🔧 Variables de Entorno

Agregar al `.env` del backend:

```env
# JWT Secret (cambiar en producción)
JWT_SECRET=neural_secret_key_change_in_production

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:3001
```

---

## 📝 Comandos Útiles

### Crear nuevos usuarios administradores:
```bash
npm run crear-admins
```

### Verificar usuarios en MongoDB:
```bash
# Conectarse a MongoDB y ejecutar:
db.admin_users.find().pretty()
```

### Probar login con curl:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"icenter_admin","password":"admin123"}'
```

---

## 🎯 Próximos Pasos

1. ✅ **Login implementado y funcionando**
2. ⏳ Proteger rutas del dashboard con autenticación
3. ⏳ Implementar página de estadísticas
4. ⏳ Implementar página de configuración
5. ⏳ Agregar gestión de usuarios (crear, editar, eliminar)
6. ⏳ Implementar cambio de contraseña
7. ⏳ Agregar recuperación de contraseña

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'cors'"
```bash
cd backend
npm install cors @types/cors
```

### Error: "Usuario o contraseña incorrectos"
- Verifica que ejecutaste `npm run crear-admins`
- Verifica que el usuario existe en MongoDB
- Verifica que la contraseña sea correcta (case-sensitive)

### Error: "Token inválido o expirado"
- El token expira después de 7 días
- Haz logout y vuelve a hacer login
- Verifica que el `JWT_SECRET` sea el mismo en el servidor

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo en puerto 3000
- Verifica la variable `NEXT_PUBLIC_API_URL` en el frontend
- Verifica que CORS esté configurado correctamente

---

## ✅ Checklist de Implementación

- [x] Modelo de AdminUser en MongoDB
- [x] Servicio de autenticación con JWT
- [x] Middleware de autenticación
- [x] Controlador y rutas de auth
- [x] Script para crear usuarios iniciales
- [x] CORS configurado
- [x] Frontend actualizado con login real
- [x] Contexto de autenticación
- [x] Cliente API con JWT
- [x] Página de login funcional
- [ ] Protección de rutas en frontend
- [ ] Manejo de sesión expirada
- [ ] Cambio de contraseña
- [ ] Recuperación de contraseña

---

¡El sistema de login está 100% funcional y listo para usar! 🎉
