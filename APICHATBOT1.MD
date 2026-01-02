# 🔑 API KEY DEL CHATBOT WHATSAPP

## ⚠️ INFORMACIÓN CONFIDENCIAL - NO COMPARTIR

---

## 📋 Detalles de la API Key

**Nombre:** WhatsApp Bot Principal

**API Key (para usar en Render):**
```
2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

**Scopes (Permisos):**
- `ordenes:create` - Crear nuevas órdenes
- `ordenes:read` - Consultar órdenes
- `ordenes:list` - Listar órdenes de un cliente
- `usuarios:read` - Consultar datos de usuarios
- `usuarios:validate` - Validar existencia de comitente

**Rate Limit:** 100 requests por minuto

**Estado:** ✅ Activa

**Creada:** 2 de enero de 2026

---

## 🔧 Configuración en Render

### Variables de Entorno

Agrega estas variables en tu servicio de Render:

```bash
# URL de la API de Intercapital
INTERCAPITAL_API_URL=https://app1.intercapital.ar/api/chatbot

# API Key (COPIAR EXACTAMENTE)
INTERCAPITAL_API_KEY=2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a

# Configuración opcional
INTERCAPITAL_TIMEOUT=30000
INTERCAPITAL_RETRY_ATTEMPTS=3
```

---

## 🧪 Probar la API Key

### 1. Health Check (sin API key)
```bash
curl https://app1.intercapital.ar/api/chatbot/health
```

### 2. Validar Usuario (con API key)
```bash
curl -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  "https://app1.intercapital.ar/api/chatbot/usuarios/validate?comitente=12345"
```

### 3. Crear Orden de Prueba
```bash
curl -X POST https://app1.intercapital.ar/api/chatbot/ordenes \
  -H "Content-Type: application/json" \
  -H "x-api-key: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a" \
  -d '{
    "comitente": 12345,
    "operacion": "COMPRA",
    "symbol": "AL30",
    "cantidad": 100,
    "precio": 850.50,
    "metadata": {
      "whatsapp_phone": "+5491112345678",
      "conversation_id": "test_001"
    }
  }'
```

---

## 📝 Ejemplo de Código Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://app1.intercapital.ar/api/chatbot',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a'
  },
  timeout: 30000
});

// Validar usuario
async function validarUsuario(comitente) {
  try {
    const response = await api.get('/usuarios/validate', {
      params: { comitente }
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Crear orden
async function crearOrden(ordenData) {
  try {
    const response = await api.post('/ordenes', ordenData);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data);
    throw error;
  }
}

// Uso
(async () => {
  // Validar usuario
  const usuario = await validarUsuario(12345);
  console.log('Usuario:', usuario);
  
  // Crear orden
  if (usuario.data.puede_operar) {
    const orden = await crearOrden({
      comitente: 12345,
      operacion: 'COMPRA',
      symbol: 'AL30',
      cantidad: 100,
      precio: 850.50,
      metadata: {
        whatsapp_phone: '+5491112345678',
        conversation_id: 'conv_123'
      }
    });
    console.log('Orden creada:', orden);
  }
})();
```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE

1. **Nunca** expongas esta API key en código público
2. **Solo** úsala en variables de entorno de Render
3. **No** la compartas por email, Slack, o WhatsApp
4. **Guárdala** en un gestor de contraseñas (1Password, Bitwarden)

### Rotación de API Key

Se recomienda rotar la API key cada **90 días** por seguridad.

Para generar una nueva:
1. Contactar al equipo de backend
2. Solicitar nueva API key
3. Actualizar en Render
4. Revocar la anterior

---

## 📊 Monitoreo

### Ver Uso de la API Key

```sql
-- Últimos 100 requests
SELECT 
  method,
  endpoint,
  status_code,
  duration_ms,
  created_at
FROM chatbot_logs
WHERE api_key_name = 'WhatsApp Bot Principal'
ORDER BY created_at DESC
LIMIT 100;

-- Estadísticas del día
SELECT 
  COUNT(*) as total_requests,
  AVG(duration_ms) as avg_duration,
  COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errors
FROM chatbot_logs
WHERE api_key_name = 'WhatsApp Bot Principal'
  AND created_at >= CURRENT_DATE;
```

---

## 🆘 Soporte

Si la API key no funciona:

1. Verifica que esté copiada exactamente (sin espacios)
2. Verifica que el header sea `x-api-key` (minúsculas)
3. Verifica que la URL sea correcta
4. Revisa los logs del backend: `pm2 logs intercapital-new-api`

---

## ✅ Checklist de Configuración

- [ ] API key copiada en Render
- [ ] Variables de entorno configuradas
- [ ] Health check funciona
- [ ] Validación de usuario funciona
- [ ] Creación de orden funciona
- [ ] Logs monitoreados

---

**Fecha de creación:** 2 de enero de 2026  
**Última actualización:** 2 de enero de 2026  
**Estado:** ✅ Activa y lista para usar
