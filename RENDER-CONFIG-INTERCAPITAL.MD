# ⚙️ CONFIGURACIÓN RENDER - BOT INTERCAPITAL

## 🚀 GUÍA RÁPIDA DE CONFIGURACIÓN

### 1️⃣ Acceder a Variables de Entorno

1. Ir a tu servicio en Render: https://dashboard.render.com
2. Seleccionar tu servicio del chatbot WhatsApp
3. Click en **"Environment"** en el menú lateral
4. Click en **"Add Environment Variable"**

---

### 2️⃣ Agregar Variables de Intercapital

Agregar las siguientes variables **exactamente como se muestran**:

#### Variable 1: URL de la API
```
Key:   INTERCAPITAL_API_URL
Value: https://app1.intercapital.ar/api/chatbot
```

#### Variable 2: API Key
```
Key:   INTERCAPITAL_API_KEY
Value: 2e590cf1f4fd1144f1ce0622347c046a0fa3e2bd786114273094049b6cd55c0a
```

#### Variable 3: Timeout (Opcional)
```
Key:   INTERCAPITAL_TIMEOUT
Value: 30000
```

#### Variable 4: Retry Attempts (Opcional)
```
Key:   INTERCAPITAL_RETRY_ATTEMPTS
Value: 3
```

---

### 3️⃣ Guardar y Reiniciar

1. Click en **"Save Changes"**
2. Render reiniciará automáticamente el servicio
3. Esperar 2-3 minutos a que el servicio esté activo

---

### 4️⃣ Verificar Configuración

Una vez que el servicio esté activo, verificar en los logs:

```bash
# En Render logs, buscar:
✅ Variables de entorno cargadas
✅ INTERCAPITAL_API_URL configurada
✅ INTERCAPITAL_API_KEY configurada
```

---

## 🧪 TESTING POST-DEPLOY

### Paso 1: Configurar MongoDB

Ejecutar el script de setup **UNA SOLA VEZ**:

```bash
# En tu máquina local
cd backend
node scripts/setup-intercapital.js
```

**Salida esperada:**
```
✅ Conectado a MongoDB
✅ Empresa encontrada: Intercapital
✅ CONFIGURACIÓN INTERCAPITAL CREADA

📋 Resumen:
   - Endpoints: 4
   - Workflows: 5
```

### Paso 2: Limpiar Estado de Testing

```bash
# Antes de cada test
node scripts/limpiar-estado-intercapital.js
```

### Paso 3: Probar en WhatsApp

1. Escribir: **"hola"** o **"intercapital"**
2. Deberías ver el menú principal
3. Probar cada opción del menú

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Variables de entorno agregadas en Render
- [ ] Servicio reiniciado correctamente
- [ ] Script `setup-intercapital.js` ejecutado
- [ ] Menú principal funciona en WhatsApp
- [ ] Flujo de compra funciona
- [ ] Flujo de venta funciona
- [ ] Flujo de retiro funciona
- [ ] Flujo de consulta funciona

---

## 🔧 TROUBLESHOOTING

### Problema: "API Key inválida"
**Solución:** Verificar que la API key esté copiada exactamente sin espacios

### Problema: "No se encuentra el workflow"
**Solución:** Ejecutar `node scripts/setup-intercapital.js` nuevamente

### Problema: "El bot no responde"
**Solución:** 
1. Verificar logs de Render
2. Verificar que las variables estén configuradas
3. Reiniciar el servicio

### Problema: "Error de conexión a la API"
**Solución:**
1. Verificar que la URL sea correcta
2. Probar el health check: `curl https://app1.intercapital.ar/api/chatbot/health`
3. Verificar que la API key sea válida

---

## 📊 MONITOREO

### Ver Logs en Render

1. Ir a tu servicio en Render
2. Click en **"Logs"** en el menú lateral
3. Buscar mensajes de Intercapital:

```
[INTERCAPITAL] GET /usuarios/validate
[INTERCAPITAL] ✅ 200 /usuarios/validate
[INTERCAPITAL] POST /ordenes
[INTERCAPITAL] ✅ 201 /ordenes
```

---

## 🎯 RESUMEN

**Tiempo estimado:** 5-10 minutos

**Pasos:**
1. ✅ Agregar 2 variables obligatorias en Render
2. ✅ Guardar y esperar reinicio (2-3 min)
3. ✅ Ejecutar script de setup en local
4. ✅ Probar en WhatsApp

**¡Listo para usar!** 🚀
