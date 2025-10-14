# 🚀 Instrucciones para Iniciar el Sistema

## 📋 Configuración de Puertos

- **Backend (API):** Puerto 3000
- **Frontend (CRM):** Puerto 3001

---

## 🔧 Backend

### 1. Editar el archivo `.env`

Asegúrate de que tu archivo `backend/.env` tenga estas variables (elimina `NEXT_PUBLIC_API_URL` si está):

```env
# MongoDB
MONGODB_URI=mongodb+srv://momento_admin:admin@clustermomento.zafwwji.mongodb.net/?retryWrites=true&w=majority&appName=ClusterMomento

# JWT Secret
JWT_SECRET=neural_secret_key_change_in_production

# OpenAI
OPENAI_API_KEY=tu_api_key

# Meta/WhatsApp
META_WHATSAPP_TOKEN=tu_token
# ... resto de configuración
```

### 2. Iniciar el Backend

```bash
cd backend
npm run build
npm start
```

Deberías ver:
```
✅ MongoDB conectado exitosamente
🚀 Servidor escuchando en http://localhost:3000
```

---

## 🌐 Frontend

### 1. Crear archivo `.env.local`

En `front_crm/bot_crm/.env.local` (créalo si no existe):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Iniciar el Frontend

```bash
cd front_crm/bot_crm
npm run dev
```

Deberías ver:
```
✓ Ready on http://localhost:3001
```

---

## 🔐 Probar el Login

1. Abre tu navegador en `http://localhost:3001`
2. Serás redirigido a `/login`
3. Usa estas credenciales:

| Empresa | Usuario | Contraseña |
|---------|---------|------------|
| Paraná Lodge | `paraná_admin` | `admin123` |
| iCenter | `icenter_admin` | `admin123` |
| Instituto Universitario del Iberá | `instituto_admin` | `admin123` |

4. Haz click en "Iniciar Sesión"
5. Deberías ser redirigido a `/dashboard`

---

## 🐛 Solución de Problemas

### Error: "Port 3000 is in use"

**Problema:** El puerto 3000 ya está ocupado por otro proceso.

**Solución:**
```bash
# En Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <numero_del_proceso> /F
```

### Error: "CORS policy"

**Problema:** El backend no acepta requests del frontend.

**Solución:**
1. Verifica que el backend esté corriendo en puerto 3000
2. Verifica que el frontend esté corriendo en puerto 3001
3. Reinicia ambos servidores
4. El CORS ahora está configurado para aceptar cualquier origen en desarrollo

### Error: "Failed to fetch"

**Problema:** El frontend no puede conectarse al backend.

**Solución:**
1. Verifica que el backend esté corriendo: `http://localhost:3000/api/status`
2. Verifica que `.env.local` tenga `NEXT_PUBLIC_API_URL=http://localhost:3000`
3. Reinicia el frontend después de crear/modificar `.env.local`

### Error: "Usuario o contraseña incorrectos"

**Problema:** Las credenciales no son correctas o los usuarios no existen.

**Solución:**
```bash
cd backend
npm run crear-admins
```

Esto creará los usuarios administradores para todas las empresas.

---

## ✅ Checklist de Inicio

Backend:
- [ ] Archivo `.env` configurado correctamente
- [ ] MongoDB URI correcta
- [ ] `npm run build` ejecutado sin errores
- [ ] Servidor corriendo en puerto 3000
- [ ] Usuarios administradores creados (`npm run crear-admins`)

Frontend:
- [ ] Archivo `.env.local` creado con `NEXT_PUBLIC_API_URL=http://localhost:3000`
- [ ] `npm install` ejecutado (si es primera vez)
- [ ] Servidor corriendo en puerto 3001
- [ ] Página de login accesible en `http://localhost:3001`

---

## 🔄 Flujo Completo

```
1. Usuario abre http://localhost:3001
   ↓
2. Redirigido a /login
   ↓
3. Ingresa credenciales (ej: icenter_admin / admin123)
   ↓
4. Frontend envía POST a http://localhost:3000/api/auth/login
   ↓
5. Backend verifica credenciales en MongoDB
   ↓
6. Backend genera JWT token (válido 7 días)
   ↓
7. Frontend guarda token en localStorage
   ↓
8. Frontend redirige a /dashboard
   ↓
9. Dashboard carga datos con token en header Authorization
```

---

## 📝 Comandos Rápidos

### Reiniciar Todo

**Terminal 1 - Backend:**
```bash
cd backend
npm run build && npm start
```

**Terminal 2 - Frontend:**
```bash
cd front_crm/bot_crm
npm run dev
```

### Ver Logs

El backend mostrará logs de cada request:
```
[2025-01-13T20:00:00.000Z] POST /api/auth/login - Origin: http://localhost:3001
```

---

## 🎯 Próximos Pasos

Una vez que el login funcione:
1. ✅ Proteger rutas del dashboard
2. ✅ Implementar página de estadísticas
3. ✅ Implementar página de configuración
4. ✅ Agregar gestión de usuarios
5. ✅ Implementar cambio de contraseña

---

¡El sistema está listo para usar! 🎉
