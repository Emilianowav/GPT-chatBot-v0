# ✅ Checklist para que funcione en Render

## 📋 Verificación de Configuración en MongoDB (Nube)

Según el objeto que compartiste, **YA TIENES** configurado:

✅ API: "API iCenter" (ID: `6917126a03862ac8bb3fd4f2`)
✅ chatbotIntegration.habilitado: `true`
✅ chatbotIntegration.chatbotId: `6917b6f3f47edd25a06720e9`
✅ Keyword: "sucursal" → endpoint `55a183e9f3532e0c9ca7eaae7b429598`
✅ Template de respuesta configurado

**La configuración en BD está PERFECTA** ✅

---

## 🚀 Lo que FALTA en Render

El servicio `gpt-chatbot-v0-1.onrender.com` DEBE tener estos archivos:

### 1. Router Universal
📁 `backend/src/services/universalRouter.ts`
- Detecta keywords
- Extrae parámetros
- Decide qué flujo ejecutar

### 2. API Keyword Handler
📁 `backend/src/services/apiKeywordHandler.ts`
- Ejecuta endpoints
- Formatea respuestas con Mustache

### 3. Integración en WhatsApp Controller
📁 `backend/src/controllers/whatsappController.ts`
- Debe llamar al router ANTES del flujo conversacional
- Líneas ~107-145

### 4. Dependencia Mustache
📦 `package.json` debe incluir:
```json
"mustache": "^4.2.0"
```

### 5. Fix en actualizarApi
📁 `backend/src/modules/integrations/controllers/apiConfigController.ts`
- Debe guardar el campo `chatbotIntegration`
- Líneas ~183-199

---

## 🔍 Cómo Verificar en Render

### Paso 1: Verificar que los archivos existen

En el dashboard de Render → tu servicio → "Logs" → busca en el deploy:

```
Building...
✓ backend/src/services/universalRouter.ts
✓ backend/src/services/apiKeywordHandler.ts
✓ backend/src/controllers/whatsappController.ts
```

### Paso 2: Verificar que Mustache está instalado

En los logs de deploy busca:
```
npm install
...
+ mustache@4.2.0
```

### Paso 3: Verificar logs en tiempo real

Cuando envíes "sucursal" por WhatsApp, deberías ver en los logs:

```
🎯 ========== ROUTER UNIVERSAL ==========
📨 Mensaje: sucursal
👤 Cliente: 5493...
🏢 Empresa: 68ed60a26ea5341d6ca35d57

🤖 Chatbot encontrado: Bot iCenter
📋 APIs con integración: 1
🎯 Keyword detectada: "sucursal" en API: API iCenter

🚀 ========== EJECUTANDO API KEYWORD ==========
📋 API: API iCenter
🔑 Keyword: sucursal
📍 Endpoint ID: 55a183e9f3532e0c9ca7eaae7b429598
✅ Endpoint encontrado: Obtener Sucursales

🚀 Ejecutando request a API externa:
   📍 URL completa: https://icenter.ar/wp-json/wc-whatsapp/v1/locations
   
✅ API ejecutada exitosamente
📝 Respuesta formateada exitosamente
```

---

## 🛠️ Si NO ves esos logs:

### Opción A: El código NO está en Render

1. Ve a tu repositorio en GitHub
2. Verifica que la rama que usa Render tenga los archivos:
   - `backend/src/services/universalRouter.ts`
   - `backend/src/services/apiKeywordHandler.ts`
3. Haz commit y push de los cambios
4. Render hará auto-deploy

### Opción B: Render está en otra rama

1. Ve a Render Dashboard → Settings
2. Verifica qué rama está usando (Branch)
3. Cambia a la rama correcta o haz merge

### Opción C: Deploy manual

1. En Render Dashboard → Manual Deploy
2. Click en "Clear build cache & deploy"

---

## 🧪 Prueba Paso a Paso

### 1. Verifica conexión a MongoDB
En logs de Render al iniciar debería decir:
```
✅ MongoDB conectado
```

### 2. Envía mensaje de prueba
WhatsApp → "Hola"
- Debería responder con GPT conversacional
- En logs verás: `💬 Redirigiendo a conversacional`

### 3. Envía keyword
WhatsApp → "sucursal"
- Debería ejecutar la API
- En logs verás: `🚀 Ejecutando API keyword...`

### 4. Si NO funciona
- Copia los logs completos de Render
- Busca errores (líneas con ❌ o ERROR)
- Verifica que no diga "Module not found"

---

## 📝 Comandos útiles para Render

### Ver logs en tiempo real:
```bash
# En el dashboard de Render
Logs → Live logs
```

### Reiniciar servicio:
```
Settings → Manual Deploy → Deploy latest commit
```

### Variables de entorno:
Verifica que tengas:
- `MONGODB_URI` → Tu cluster de MongoDB Atlas
- `OPENAI_API_KEY`
- Tokens de WhatsApp

---

## ✅ Checklist Final

- [ ] Archivos del Router Universal en el repo
- [ ] Mustache en package.json
- [ ] Rama correcta configurada en Render
- [ ] Deploy exitoso (sin errores)
- [ ] MongoDB conectado
- [ ] Logs muestran "ROUTER UNIVERSAL" al enviar mensaje
- [ ] Keyword detectada en logs
- [ ] API ejecutada exitosamente

**Si todos los checks están ✅ y aún no funciona, necesito ver los logs de Render.**
