# 🔐 Guía del Sistema SUPER_ADMIN

## 📋 Descripción

El sistema **SUPER_ADMIN** permite la administración completa de todas las empresas en la plataforma. Es un rol especial que tiene acceso global al sistema sin restricciones de empresa.

---

## 🏢 Empresa MOMENTO

**MOMENTO** es la empresa administradora del sistema. Todos los usuarios con rol `super_admin` deben estar asociados a esta empresa.

### Características:
- **Nombre:** MOMENTO
- **Email:** admin@momentoia.co
- **Plan:** Enterprise
- **Límites:** Ilimitados
- **Teléfono:** +5493794999999

---

## 👤 Usuario SuperAdmin

### Credenciales de Acceso:
```
Username: superadmin
Password: Momento2025!Admin
Email: superadmin@momentoia.co
```

⚠️ **IMPORTANTE:** Cambia la contraseña después del primer login.

---

## 🔑 Roles del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `super_admin` | Administrador maestro del sistema | Todas las empresas |
| `admin` | Administrador de empresa | Solo su empresa |
| `manager` | Gerente de empresa | Solo su empresa (permisos limitados) |
| `agent` | Agente/Operador | Solo su empresa (permisos básicos) |
| `viewer` | Visualizador | Solo lectura de su empresa |

---

## 🌐 Endpoints del SuperAdmin

### Autenticación

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "Momento2025!Admin"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "superadmin",
    "empresaId": "MOMENTO",
    "empresaNombre": "MOMENTO",
    "role": "super_admin",
    "email": "superadmin@momentoia.co"
  }
}
```

---

### Gestión de Empresas

#### 1. Crear Nueva Empresa (Onboarding)
```http
POST /api/sa/empresas
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Mi Empresa",
  "email": "contacto@miempresa.com",
  "telefono": "+5493794123456",
  "plan": "standard",
  "categoria": "comercio"
}
```

**Planes disponibles:**
- `basico` - 1,000 mensajes/mes, 5 usuarios
- `standard` - 5,000 mensajes/mes, 10 usuarios
- `premium` - 15,000 mensajes/mes, 25 usuarios
- `enterprise` - 50,000 mensajes/mes, 100 usuarios

**Respuesta:**
```json
{
  "success": true,
  "message": "Empresa creada exitosamente",
  "empresa": {
    "id": "...",
    "nombre": "Mi Empresa",
    "email": "contacto@miempresa.com",
    "telefono": "+5493794123456",
    "plan": "standard"
  }
}
```

---

#### 2. Listar Todas las Empresas
```http
GET /api/sa/empresas
Authorization: Bearer {token}
```

**Filtros disponibles (query params):**
- `nombre` - Buscar por nombre o email
- `categoria` - Filtrar por categoría
- `plan` - Filtrar por plan (basico, standard, premium, enterprise)
- `estadoFacturacion` - Filtrar por estado (activo, suspendido, prueba)
- `sinUso` - true/false (empresas sin mensajes)
- `cercaLimite` - true/false (empresas con >80% de uso)
- `conWhatsApp` - true/false (empresas con WhatsApp conectado)

**Ejemplo:**
```http
GET /api/sa/empresas?plan=standard&cercaLimite=true
```

**Respuesta:**
```json
{
  "success": true,
  "total": 5,
  "empresas": [
    {
      "id": "...",
      "nombre": "Mi Empresa",
      "email": "contacto@miempresa.com",
      "telefono": "+5493794123456",
      "categoria": "comercio",
      "plan": "standard",
      "estadoFacturacion": "activo",
      "mensajesEsteMes": 4200,
      "limitesMensajes": 5000,
      "porcentajeUso": "84.0%",
      "usuariosActivos": 8,
      "limiteUsuarios": 500,
      "porcentajeUsuarios": "1.6%",
      "whatsappConectado": true,
      "fechaCreacion": "2025-11-05T18:00:00.000Z",
      "ultimoPago": "2025-11-01T00:00:00.000Z",
      "proximoPago": "2025-12-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 3. Ver Detalle de Empresa
```http
GET /api/sa/empresas/:id
Authorization: Bearer {token}
```

**Ejemplo:**
```http
GET /api/sa/empresas/Mi%20Empresa
```

**Respuesta:**
```json
{
  "success": true,
  "empresa": {
    "id": "...",
    "nombre": "Mi Empresa",
    "categoria": "comercio",
    "email": "contacto@miempresa.com",
    "telefono": "+5493794123456",
    "modelo": "gpt-3.5-turbo",
    "prompt": "Sos el asistente virtual de Mi Empresa...",
    "saludos": ["¡Hola! 👋 Bienvenido a Mi Empresa..."],
    "plan": "standard",
    "modulos": [],
    "limites": {
      "mensajesMensuales": 5000,
      "usuariosActivos": 500,
      "almacenamiento": 1000,
      "integraciones": 3,
      "exportacionesMensuales": 10,
      "agentesSimultaneos": 2,
      "maxUsuarios": 10,
      "maxAdmins": 2
    },
    "uso": {
      "mensajesEsteMes": 4200,
      "usuariosActivos": 8,
      "almacenamientoUsado": 250,
      "exportacionesEsteMes": 3,
      "ultimaActualizacion": "2025-11-05T18:00:00.000Z"
    },
    "metricas": {
      "porcentajeUsoMensajes": "84.0%",
      "porcentajeUsoUsuarios": "1.6%",
      "totalClientes": 150,
      "totalStaff": 5,
      "whatsappConectado": true
    },
    "facturacion": {
      "estado": "activo",
      "metodoPago": "tarjeta",
      "ultimoPago": "2025-11-01T00:00:00.000Z",
      "proximoPago": "2025-12-01T00:00:00.000Z"
    },
    "alertas": [
      {
        "tipo": "warning",
        "mensaje": "Cerca del límite de mensajes mensuales"
      }
    ],
    "fechaCreacion": "2025-10-01T00:00:00.000Z",
    "fechaActualizacion": "2025-11-05T18:00:00.000Z"
  }
}
```

---

#### 4. Crear Usuario Admin para Empresa
```http
POST /api/sa/empresas/:id/user
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "admin_miempresa",
  "password": "Password123!",
  "email": "admin@miempresa.com",
  "nombre": "Juan",
  "apellido": "Pérez"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario admin creado exitosamente",
  "usuario": {
    "id": "...",
    "username": "admin_miempresa",
    "email": "admin@miempresa.com",
    "nombre": "Juan",
    "rol": "admin"
  }
}
```

---

## 🔒 Seguridad

### Autenticación
Todas las rutas de SuperAdmin requieren:
1. Token JWT válido en el header `Authorization: Bearer {token}`
2. Rol `super_admin` en el token

### Middleware de Protección
```typescript
router.use(authenticate);        // Verifica JWT
router.use(requireSuperAdmin);   // Verifica rol super_admin
```

---

## 🚀 Flujo de Onboarding

### 1. SuperAdmin crea la empresa
```bash
POST /api/sa/empresas
{
  "nombre": "Nueva Empresa",
  "email": "contacto@nuevaempresa.com",
  "telefono": "+5493794111111",
  "plan": "standard"
}
```

### 2. SuperAdmin crea el usuario admin
```bash
POST /api/sa/empresas/Nueva%20Empresa/user
{
  "username": "admin_nueva",
  "password": "TempPass123!",
  "email": "admin@nuevaempresa.com",
  "nombre": "Admin",
  "apellido": "Nueva Empresa"
}
```

### 3. Se envía acceso al cliente
El cliente recibe:
- Username: `admin_nueva`
- Password: `TempPass123!`
- URL: `https://crm.momentoia.co`

### 4. Cliente configura su chatbot
El admin de la empresa puede:
- Modificar el prompt
- Configurar saludos
- Activar módulos
- Gestionar usuarios de su equipo

---

## 📊 Métricas y Alertas

### Tipos de Alertas
- **Info:** Empresa sin uso
- **Warning:** Cerca del límite (>80%)
- **Error:** Facturación suspendida, WhatsApp desconectado

### Indicadores Clave
- **% Uso de Mensajes:** `uso.mensajesEsteMes / limites.mensajesMensuales`
- **% Uso de Usuarios:** `uso.usuariosActivos / limites.usuariosActivos`
- **Estado WhatsApp:** `phoneNumberId` presente o no
- **Módulos Activos:** `modulos.filter(m => m.activo).length`

---

## 🛠️ Comandos Útiles

### Crear SuperAdmin (primera vez)
```bash
npm run create:superadmin
```

### Verificar empresas
```bash
# En MongoDB Compass o mongo shell
db.empresas.find({ nombre: "MOMENTO" })
db.usuarios_empresa.find({ rol: "super_admin" })
```

---

## 🔄 Diferencias con Admin Normal

| Característica | Admin Normal | Super Admin |
|----------------|--------------|-------------|
| **Empresas visibles** | Solo la suya | Todas |
| **Crear empresas** | ❌ No | ✅ Sí |
| **Ver métricas globales** | ❌ No | ✅ Sí |
| **Modificar otras empresas** | ❌ No | ✅ Sí (solo crear usuarios) |
| **Acceso a /api/sa/** | ❌ No | ✅ Sí |
| **Acceso a /api/empresas/:id** | ✅ Solo su empresa | ❌ No (usa /api/sa/) |

---

## 📝 Notas Importantes

1. **No modifica configuración interna:** El SuperAdmin NO debe modificar el prompt, saludos o configuración del chatbot de otras empresas. Solo crea empresas y usuarios admin.

2. **Empresa MOMENTO es especial:** Es la única empresa con rol `super_admin`. No debe ser eliminada.

3. **Un servicio, una empresa:** Si un cliente necesita múltiples servicios, se crean múltiples empresas.

4. **Límites automáticos:** Los límites se asignan automáticamente según el plan elegido.

5. **Facturación activa por defecto:** Las empresas nuevas se crean con estado `activo` y 30 días de validez.

---

## 🐛 Troubleshooting

### Error: "Token inválido o expirado"
- Verifica que el token esté en el header: `Authorization: Bearer {token}`
- El token expira en 7 días, solicita uno nuevo con `/api/auth/login`

### Error: "Acceso denegado. Se requiere rol de super administrador"
- Verifica que el usuario tenga rol `super_admin`
- Solo usuarios de la empresa MOMENTO pueden tener este rol

### Error: "Empresa no encontrada"
- Verifica que el nombre de la empresa sea exacto (case-sensitive)
- Usa el nombre, no el ID de MongoDB

---

## 📞 Soporte

Para soporte técnico o consultas:
- Email: soporte@momentoia.co
- Documentación: https://docs.momentoia.co

---

**Última actualización:** 2025-11-05
**Versión:** 1.0.0
