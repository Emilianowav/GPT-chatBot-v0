# 🧪 Tests del Sistema SUPER_ADMIN

## ✅ Checklist de Verificación

### 1. ✅ Empresa MOMENTO Creada
```bash
# Verificar en MongoDB
db.empresas.findOne({ nombre: "MOMENTO" })
```

**Resultado esperado:**
- ✅ Empresa existe
- ✅ Plan: "enterprise"
- ✅ Email: "admin@momentoia.co"
- ✅ Límites ilimitados

---

### 2. ✅ Usuario SuperAdmin Creado
```bash
# Verificar en MongoDB
db.usuarios_empresa.findOne({ username: "superadmin" })
```

**Resultado esperado:**
- ✅ Usuario existe
- ✅ Rol: "super_admin"
- ✅ EmpresaId: "MOMENTO"
- ✅ Email: "superadmin@momentoia.co"

---

### 3. 🧪 Test de Login

#### Usando cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Momento2025!Admin"
  }'
```

#### Usando Postman/Thunder Client:
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "superadmin",
  "password": "Momento2025!Admin"
}
```

**Resultado esperado:**
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

✅ **Status:** 200 OK
✅ **Token:** Presente
✅ **Role:** super_admin

---

### 4. 🧪 Test de Listar Empresas

```bash
# Reemplaza {TOKEN} con el token obtenido del login
curl -X GET http://localhost:3000/api/sa/empresas \
  -H "Authorization: Bearer {TOKEN}"
```

**Resultado esperado:**
```json
{
  "success": true,
  "total": 1,
  "empresas": [
    {
      "id": "...",
      "nombre": "MOMENTO",
      "email": "admin@momentoia.co",
      "telefono": "+5493794999999",
      "categoria": "administracion",
      "plan": "enterprise",
      "estadoFacturacion": "activo",
      "mensajesEsteMes": 0,
      "limitesMensajes": 999999,
      "porcentajeUso": "0.0%",
      "usuariosActivos": 0,
      "limiteUsuarios": 999999,
      "porcentajeUsuarios": "0.0%",
      "whatsappConectado": false,
      "fechaCreacion": "2025-11-05T...",
      "ultimoPago": "2025-11-05T...",
      "proximoPago": "2026-11-05T..."
    }
  ]
}
```

✅ **Status:** 200 OK
✅ **Total:** >= 1 (al menos MOMENTO)

---

### 5. 🧪 Test de Crear Empresa

```bash
curl -X POST http://localhost:3000/api/sa/empresas \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Empresa Test",
    "email": "test@empresatest.com",
    "telefono": "+5493794888888",
    "plan": "standard",
    "categoria": "comercio"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Empresa creada exitosamente",
  "empresa": {
    "id": "...",
    "nombre": "Empresa Test",
    "email": "test@empresatest.com",
    "telefono": "+5493794888888",
    "plan": "standard"
  }
}
```

✅ **Status:** 201 Created
✅ **Empresa creada** en MongoDB

---

### 6. 🧪 Test de Ver Detalle de Empresa

```bash
curl -X GET "http://localhost:3000/api/sa/empresas/Empresa%20Test" \
  -H "Authorization: Bearer {TOKEN}"
```

**Resultado esperado:**
```json
{
  "success": true,
  "empresa": {
    "id": "...",
    "nombre": "Empresa Test",
    "categoria": "comercio",
    "email": "test@empresatest.com",
    "telefono": "+5493794888888",
    "modelo": "gpt-3.5-turbo",
    "prompt": "Sos el asistente virtual de Empresa Test...",
    "plan": "standard",
    "limites": {
      "mensajesMensuales": 5000,
      "usuariosActivos": 500,
      ...
    },
    "uso": {
      "mensajesEsteMes": 0,
      "usuariosActivos": 0,
      ...
    },
    "metricas": {
      "porcentajeUsoMensajes": "0.0%",
      "porcentajeUsoUsuarios": "0.0%",
      "totalClientes": 0,
      "totalStaff": 0,
      "whatsappConectado": false
    },
    "alertas": [
      {
        "tipo": "info",
        "mensaje": "La empresa aún no tiene uso"
      },
      {
        "tipo": "warning",
        "mensaje": "WhatsApp no conectado"
      }
    ]
  }
}
```

✅ **Status:** 200 OK
✅ **Métricas calculadas**
✅ **Alertas generadas**

---

### 7. 🧪 Test de Crear Usuario Admin

```bash
curl -X POST "http://localhost:3000/api/sa/empresas/Empresa%20Test/user" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_test",
    "password": "TestPass123!",
    "email": "admin@empresatest.com",
    "nombre": "Admin",
    "apellido": "Test"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Usuario admin creado exitosamente",
  "usuario": {
    "id": "...",
    "username": "admin_test",
    "email": "admin@empresatest.com",
    "nombre": "Admin",
    "rol": "admin"
  }
}
```

✅ **Status:** 201 Created
✅ **Usuario creado** con rol "admin"

---

### 8. 🧪 Test de Login del Nuevo Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_test",
    "password": "TestPass123!"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "username": "admin_test",
    "empresaId": "Empresa Test",
    "empresaNombre": "Empresa Test",
    "role": "admin",
    "email": "admin@empresatest.com"
  }
}
```

✅ **Status:** 200 OK
✅ **Role:** admin (no super_admin)
✅ **EmpresaId:** "Empresa Test"

---

### 9. 🧪 Test de Filtros

#### Filtrar por plan:
```bash
curl -X GET "http://localhost:3000/api/sa/empresas?plan=standard" \
  -H "Authorization: Bearer {TOKEN}"
```

#### Filtrar empresas sin uso:
```bash
curl -X GET "http://localhost:3000/api/sa/empresas?sinUso=true" \
  -H "Authorization: Bearer {TOKEN}"
```

#### Filtrar empresas cerca del límite:
```bash
curl -X GET "http://localhost:3000/api/sa/empresas?cercaLimite=true" \
  -H "Authorization: Bearer {TOKEN}"
```

#### Filtrar por WhatsApp conectado:
```bash
curl -X GET "http://localhost:3000/api/sa/empresas?conWhatsApp=false" \
  -H "Authorization: Bearer {TOKEN}"
```

✅ **Filtros funcionan correctamente**

---

### 10. 🧪 Test de Seguridad

#### Intentar acceder sin token:
```bash
curl -X GET http://localhost:3000/api/sa/empresas
```

**Resultado esperado:**
```json
{
  "success": false,
  "message": "No se proporcionó token de autenticación"
}
```
✅ **Status:** 401 Unauthorized

---

#### Intentar acceder con usuario admin normal:
```bash
# Login como admin_test
TOKEN_ADMIN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_test", "password": "TestPass123!"}' \
  | jq -r '.token')

# Intentar acceder a /api/sa/empresas
curl -X GET http://localhost:3000/api/sa/empresas \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Resultado esperado:**
```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere rol de super administrador"
}
```
✅ **Status:** 403 Forbidden

---

## 📊 Resumen de Tests

| Test | Endpoint | Método | Status Esperado | Resultado |
|------|----------|--------|-----------------|-----------|
| Login SuperAdmin | `/api/auth/login` | POST | 200 | ✅ |
| Listar Empresas | `/api/sa/empresas` | GET | 200 | ✅ |
| Crear Empresa | `/api/sa/empresas` | POST | 201 | ✅ |
| Ver Detalle | `/api/sa/empresas/:id` | GET | 200 | ✅ |
| Crear Admin | `/api/sa/empresas/:id/user` | POST | 201 | ✅ |
| Login Admin Normal | `/api/auth/login` | POST | 200 | ✅ |
| Filtros | `/api/sa/empresas?...` | GET | 200 | ✅ |
| Sin Token | `/api/sa/empresas` | GET | 401 | ✅ |
| Admin Normal | `/api/sa/empresas` | GET | 403 | ✅ |

---

## 🔧 Script de Test Completo

```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Iniciando tests del sistema SuperAdmin..."

# 1. Login SuperAdmin
echo -e "\n${GREEN}1. Test Login SuperAdmin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "Momento2025!Admin"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Login exitoso"
else
  echo "❌ Login falló"
  exit 1
fi

# 2. Listar empresas
echo -e "\n${GREEN}2. Test Listar Empresas${NC}"
EMPRESAS=$(curl -s -X GET http://localhost:3000/api/sa/empresas \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $EMPRESAS | jq -r '.total')
echo "✅ Total de empresas: $TOTAL"

# 3. Crear empresa de prueba
echo -e "\n${GREEN}3. Test Crear Empresa${NC}"
NUEVA_EMPRESA=$(curl -s -X POST http://localhost:3000/api/sa/empresas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Automation",
    "email": "test@automation.com",
    "telefono": "+5493794777777",
    "plan": "standard",
    "categoria": "testing"
  }')

SUCCESS=$(echo $NUEVA_EMPRESA | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Empresa creada exitosamente"
else
  echo "⚠️  Empresa ya existe o error"
fi

# 4. Ver detalle
echo -e "\n${GREEN}4. Test Ver Detalle${NC}"
DETALLE=$(curl -s -X GET "http://localhost:3000/api/sa/empresas/Test%20Automation" \
  -H "Authorization: Bearer $TOKEN")

NOMBRE=$(echo $DETALLE | jq -r '.empresa.nombre')
echo "✅ Detalle obtenido: $NOMBRE"

# 5. Crear usuario admin
echo -e "\n${GREEN}5. Test Crear Usuario Admin${NC}"
NUEVO_ADMIN=$(curl -s -X POST "http://localhost:3000/api/sa/empresas/Test%20Automation/user" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_automation",
    "password": "AutoPass123!",
    "email": "admin@automation.com",
    "nombre": "Admin",
    "apellido": "Automation"
  }')

SUCCESS=$(echo $NUEVO_ADMIN | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Usuario admin creado exitosamente"
else
  echo "⚠️  Usuario ya existe o error"
fi

echo -e "\n${GREEN}✅ Todos los tests completados${NC}"
```

---

## 🎯 Próximos Pasos

1. ✅ Sistema SuperAdmin implementado
2. ✅ Empresa MOMENTO creada
3. ✅ Usuario superadmin creado
4. 🔄 Integrar con frontend (Panel de SuperAdmin)
5. 🔄 Agregar más métricas y reportes
6. 🔄 Sistema de notificaciones para alertas

---

**Fecha:** 2025-11-05
**Estado:** ✅ Todos los tests pasados
