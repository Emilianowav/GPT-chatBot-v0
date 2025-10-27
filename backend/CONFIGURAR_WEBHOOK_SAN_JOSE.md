# 🚀 Configuración del Webhook para San Jose

## ✅ Estado Actual

El bot de pasos ya está implementado y listo para funcionar. Solo necesitamos configurar el webhook de WhatsApp.

---

## 📋 Datos de San Jose

### Empresa:
- **Nombre:** San Jose
- **Teléfono:** +5493794044092
- **Phone Number ID:** 888481464341184
- **WABA ID:** 772636765924023
- **Verify Code:** 643175

### Bot Configurado:
- ✅ Activo
- ✅ Horario: 06:00 - 22:00 (todos los días)
- ✅ Funciones: Reservar, Consultar, Cancelar viajes
- ✅ Campos: Origen, Destino, Pasajeros, Tipo de viaje
- ✅ Choferes: Juan Pérez, María González

---

## 🔧 Paso 1: Verificar que el Backend esté Corriendo

### Opción A: Servidor Local (Desarrollo)

Si estás probando en local:

```bash
cd c:\Users\Usuario\Desktop\WEBPROYECTS\neural\backend
npm run dev
```

El servidor debería estar en: `http://localhost:3000`

### Opción B: Servidor en Producción (Render)

Si ya está desplegado en Render:
- URL: `https://gpt-chatbot-v0.onrender.com`
- Verificar que esté activo visitando: `https://gpt-chatbot-v0.onrender.com/health`

---

## 🌐 Paso 2: Configurar Webhook en Meta

### A. Acceder a Meta for Developers

1. Ve a: https://developers.facebook.com/
2. Selecciona tu App de WhatsApp Business
3. Ve a **WhatsApp** → **Configuration**

### B. Configurar el Webhook

En la sección **Webhook**:

#### 1. Callback URL:
```
https://gpt-chatbot-v0.onrender.com/webhook
```

O si estás en local (necesitas ngrok):
```
https://tu-url-de-ngrok.ngrok.io/webhook
```

#### 2. Verify Token:
Busca en tu `.env` el valor de `WEBHOOK_VERIFY_TOKEN`. Si no existe, usa:
```
tu_verify_token
```

#### 3. Webhook Fields (Campos a suscribir):
Marca estas opciones:
- ✅ **messages** (Obligatorio)
- ✅ **message_status** (Opcional, para ver estados de entrega)

#### 4. Haz clic en **Verify and Save**

### C. Suscribir el Número

1. En la sección **Phone Numbers**
2. Busca el número: **+5493794044092**
3. Haz clic en **Manage**
4. En **Webhook fields**, asegúrate de que esté suscrito a **messages**

---

## 🧪 Paso 3: Probar el Bot

### Prueba 1: Mensaje Inicial

**Envía por WhatsApp a +5493794044092:**
```
Hola
```

**Respuesta esperada:**
```
¡Hola! 👋 Soy el asistente virtual de *San Jose Viajes* 🚌

¿En qué puedo ayudarte?

1️⃣ Reservar un viaje
2️⃣ Consultar mis viajes
3️⃣ Cancelar un viaje

Escribe el número de la opción que necesites.
```

### Prueba 2: Reservar un Viaje Completo

**Paso a paso:**

1. **Tú:** `1`
2. **Bot:** Pide la fecha (DD/MM/AAAA)
3. **Tú:** `30/10/2025`
4. **Bot:** Pide la hora (HH:MM)
5. **Tú:** `08:00`
6. **Bot:** Muestra lista de choferes
7. **Tú:** `1` (Juan Pérez)
8. **Bot:** Pide origen
9. **Tú:** `Buenos Aires`
10. **Bot:** Pide destino
11. **Tú:** `Córdoba`
12. **Bot:** Pide cantidad de pasajeros
13. **Tú:** `3`
14. **Bot:** Pide tipo de viaje
15. **Tú:** `Ida y vuelta`
16. **Bot:** Pide observaciones
17. **Tú:** `Viaje familiar`
18. **Bot:** Muestra resumen y pide confirmación
19. **Tú:** `1` (Confirmar)
20. **Bot:** Confirma que el viaje fue agendado ✅

### Prueba 3: Verificar en el Dashboard

1. Ve al dashboard: https://gpt-chatbot-v0.onrender.com
2. Login con: `sanjose_admin` / `SanJose2025!`
3. Ve a **Calendario** → **Turnos**
4. Deberías ver el viaje creado con:
   - Fecha: 30/10/2025 08:00
   - Chofer: Juan Pérez
   - Cliente: (tu número de WhatsApp)
   - Datos: Origen, Destino, Pasajeros, etc.

---

## 🐛 Solución de Problemas

### El bot no responde

**Posibles causas:**

1. **Webhook no configurado correctamente**
   - Verifica la URL del webhook
   - Verifica el verify token
   - Revisa los logs en Meta for Developers

2. **Servidor backend no está corriendo**
   - Verifica que el servidor esté activo
   - Revisa los logs del servidor

3. **Número no suscrito al webhook**
   - Verifica que el número esté suscrito a "messages"

### El bot responde pero no guarda los turnos

**Verifica:**

1. **Conexión a MongoDB**
   ```bash
   # En los logs del servidor deberías ver:
   ✅ MongoDB conectado exitosamente
   ```

2. **Configuración del bot activa**
   ```bash
   # Ejecuta el script de verificación:
   node dist/scripts/verificarSanJose.js
   ```

3. **Logs del servidor**
   - Busca errores relacionados con `botTurnosService`
   - Busca errores de MongoDB

### El bot responde con el mensaje de OpenAI en lugar del bot de pasos

**Causa:** El bot de turnos no está activo o hay un error

**Solución:**
1. Verifica que la configuración del bot esté activa:
   ```bash
   node dist/scripts/verificarSanJose.js
   ```
2. Revisa los logs del servidor para ver si hay errores en `botTurnosService`

---

## 📊 Verificar Logs del Servidor

### En desarrollo (local):
Los logs aparecerán en la terminal donde ejecutaste `npm run dev`

Busca mensajes como:
```
🤖 BOT DE TURNOS - Procesando mensaje
✅ Bot activo para empresa: San Jose
📝 Paso actual: menu_principal
```

### En producción (Render):
1. Ve a tu dashboard de Render
2. Selecciona el servicio del backend
3. Ve a la pestaña **Logs**
4. Busca los mensajes del bot

---

## 🔍 Comandos Útiles

### Verificar configuración de San Jose:
```bash
cd c:\Users\Usuario\Desktop\WEBPROYECTS\neural\backend
npm run build
node dist/scripts/verificarSanJose.js
```

### Ver todos los agentes:
```bash
node dist/scripts/verificarAgentes.js
```

### Probar endpoint de agentes:
```bash
node dist/scripts/testAgentesEndpoint.js
```

---

## 📱 Usar ngrok para Desarrollo Local

Si quieres probar en local sin desplegar:

### 1. Instalar ngrok:
```bash
# Descarga de: https://ngrok.com/download
# O con chocolatey:
choco install ngrok
```

### 2. Iniciar ngrok:
```bash
ngrok http 3000
```

### 3. Copiar la URL:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:3000
```

### 4. Configurar en Meta:
Usa `https://abc123.ngrok.io/webhook` como Callback URL

---

## ✅ Checklist Final

Antes de probar, verifica:

- [ ] Backend está corriendo (local o producción)
- [ ] MongoDB está conectado
- [ ] Configuración de San Jose está activa (bot y módulo)
- [ ] Webhook configurado en Meta
- [ ] Número suscrito al webhook
- [ ] Verify token coincide
- [ ] Phone Number ID es correcto (888481464341184)

---

## 🎉 ¡Listo para Probar!

Una vez configurado todo:

1. Envía un mensaje de WhatsApp a: **+5493794044092**
2. El bot debería responder con el menú
3. Sigue el flujo para crear un viaje
4. Verifica en el dashboard que se guardó correctamente

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración con los scripts de verificación
3. Asegúrate de que el webhook esté correctamente configurado en Meta

**¡El bot está listo para funcionar! 🚀**
