# 🔍 Cómo Verificar si se Están Guardando los Datos

## 🌐 Tu Servidor en Render
URL: https://gpt-chatbot-v0.onrender.com

---

## ✅ Método 1: Endpoints de Verificación (Nuevo)

He creado dos endpoints para que puedas verificar el estado del sistema:

### 1️⃣ Verificar Estado del Sistema
```
GET https://gpt-chatbot-v0.onrender.com/api/status
```

**Qué muestra:**
- ✅ Si el archivo `usuarios.json` existe
- 📊 Cantidad de usuarios guardados
- 🕐 Última modificación del archivo
- 👥 Últimos 5 usuarios registrados
- ⚠️ Advertencia sobre sistema de archivos efímero en Render

**Cómo usarlo:**
1. Abre tu navegador
2. Ve a: https://gpt-chatbot-v0.onrender.com/api/status
3. Verás un JSON con toda la información

### 2️⃣ Listar Todos los Usuarios
```
GET https://gpt-chatbot-v0.onrender.com/api/usuarios
```

**Qué muestra:**
- Lista completa de usuarios
- ID, nombre, empresa, interacciones
- Tokens consumidos
- Última interacción

---

## 📋 Método 2: Logs de Render

### Paso a Paso:

1. **Accede al Dashboard de Render**
   - Ve a: https://dashboard.render.com
   - Inicia sesión con tu cuenta

2. **Selecciona tu Servicio**
   - Busca "gpt-chatbot-v0" en tu lista de servicios
   - Haz clic en él

3. **Ve a la Pestaña "Logs"**
   - En el menú lateral, haz clic en "Logs"
   - Los logs se actualizan en tiempo real

4. **Envía un Mensaje de Prueba**
   - Envía un mensaje desde WhatsApp a uno de tus números
   - Observa los logs en tiempo real

5. **Busca estos Emojis en los Logs:**
   - `📋 Datos extraídos del webhook` → Mensaje recibido
   - `🏢 Empresa encontrada` → Empresa identificada correctamente
   - `👤 Usuario obtenido/creado` → Usuario recuperado o creado
   - `🔄 Actualizando usuario` → Inicio del proceso de guardado
   - `📝 Usuario encontrado en índice X` → Usuario existente actualizado
   - `💾 Usuarios guardados correctamente` → **CONFIRMACIÓN DE GUARDADO**
   - `✅ Usuario guardado después del...` → Guardado exitoso

---

## ⚠️ PROBLEMA CRÍTICO: Sistema de Archivos Efímero

**Render usa un sistema de archivos efímero**, lo que significa:

❌ **Los datos en `usuarios.json` se pierden al reiniciar el servidor**
❌ **Cada deploy borra todos los datos**
❌ **No hay persistencia real de datos**

### 🛠️ Soluciones Disponibles:

#### **Opción 1: Render Disk (Rápida)**
- Costo: $0.25/mes por 1GB
- Ya creé el archivo `render.yaml` con la configuración
- Solo necesitas hacer commit y push:
  ```bash
  git add render.yaml
  git commit -m "Agregar Render Disk para persistencia"
  git push
  ```
- Render detectará automáticamente la configuración

#### **Opción 2: MongoDB Atlas (Recomendada)**
- **GRATIS** hasta 512MB
- Persistencia real de datos
- Escalable y profesional
- Lee el archivo `MIGRACION_DB.md` para instrucciones

#### **Opción 3: PostgreSQL en Render**
- Render ofrece PostgreSQL gratuito
- Más robusto que archivos JSON
- Requiere migración de código

---

## 🧪 Prueba Rápida

1. **Verifica el estado actual:**
   ```
   https://gpt-chatbot-v0.onrender.com/api/status
   ```

2. **Envía un mensaje de WhatsApp** a cualquiera de tus números configurados

3. **Vuelve a verificar el estado:**
   ```
   https://gpt-chatbot-v0.onrender.com/api/status
   ```

4. **Compara:** ¿Aumentó la cantidad de usuarios?

---

## 📊 Ejemplo de Respuesta del Endpoint `/api/status`

```json
{
  "timestamp": "2025-10-13T17:48:00.000Z",
  "servidor": {
    "plataforma": "linux",
    "nodeVersion": "v20.11.0",
    "uptime": 3600,
    "memoria": {
      "usada": "45 MB",
      "total": "128 MB"
    }
  },
  "archivos": {
    "usuarios": {
      "existe": true,
      "ruta": "/opt/render/project/src/data/usuarios.json",
      "cantidad": 5,
      "ultimaModificacion": "2025-10-13T17:45:00.000Z",
      "ultimos5": [
        {
          "id": "5493794543949",
          "nombre": "Emiliano De Biasi",
          "empresaId": "Crumble",
          "interacciones": 6,
          "ultimaInteraccion": "2025-08-15T00:25:02.087Z"
        }
      ]
    }
  },
  "advertencia": "⚠️ RENDER: Sistema de archivos efímero. Los datos se pierden al reiniciar. Considera usar Render Disk o una base de datos."
}
```

---

## 🚀 Próximos Pasos Recomendados

1. ✅ **Verifica que los datos se guardan** (usa los endpoints)
2. ⚠️ **Decide qué solución de persistencia usar**
3. 🔧 **Implementa Render Disk o migra a MongoDB**
4. 🧪 **Prueba que todo funcione correctamente**

---

## 💡 Notas Importantes

- Los logs con emojis te ayudarán a debuggear cualquier problema
- El endpoint `/api/status` es público (considera agregar autenticación en producción)
- Si ves que los datos se guardan pero luego desaparecen, es por el sistema efímero de Render
