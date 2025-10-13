# 🚀 Guía de Despliegue a Render

## 📦 Cambios Realizados

### Nuevos Archivos:
1. ✅ `src/controllers/statusController.ts` - Controlador para verificar estado
2. ✅ `src/routes/statusRoutes.ts` - Rutas de verificación
3. ✅ `render.yaml` - Configuración de Render Disk
4. ✅ Logs mejorados en `whatsappController.ts` y `usuarioStore.ts`

### Archivos Modificados:
1. ✅ `src/app.ts` - Agregadas rutas de status
2. ✅ `src/controllers/whatsappController.ts` - Logs de depuración
3. ✅ `src/utils/usuarioStore.ts` - Logs de guardado
4. ✅ `.gitignore` - Actualizado

---

## 🔧 Pasos para Desplegar

### 1. Compilar el Código
```bash
npm run build
```

### 2. Commit y Push
```bash
git add .
git commit -m "feat: agregar endpoints de verificación y logs mejorados"
git push origin main
```

### 3. Render Detectará Automáticamente
- Render detectará el push
- Iniciará el build automáticamente
- Desplegará la nueva versión

---

## 🧪 Verificar el Despliegue

### 1. Espera a que termine el build en Render
- Ve a: https://dashboard.render.com
- Selecciona tu servicio
- Espera a que el estado sea "Live"

### 2. Prueba los Nuevos Endpoints

**Verificar Estado:**
```
https://gpt-chatbot-v0.onrender.com/api/status
```

**Listar Usuarios:**
```
https://gpt-chatbot-v0.onrender.com/api/usuarios
```

### 3. Envía un Mensaje de Prueba
- Envía un mensaje de WhatsApp
- Verifica los logs en Render
- Vuelve a consultar `/api/status`

---

## ⚠️ Configurar Render Disk (Opcional pero Recomendado)

El archivo `render.yaml` ya está configurado, pero necesitas activarlo:

### Opción A: Desde el Dashboard (Más Fácil)

1. Ve a tu servicio en Render
2. Settings → Disks
3. Haz clic en "Add Disk"
4. Configura:
   - **Name:** `chatbot-data`
   - **Mount Path:** `/opt/render/project/src/data`
   - **Size:** 1 GB
5. Guarda y redeploy

### Opción B: Usar render.yaml (Automático)

El archivo `render.yaml` ya está en el repo. Render lo detectará automáticamente en el próximo deploy.

**Costo:** $0.25/mes por 1GB

---

## 📊 Monitoreo Post-Despliegue

### Logs en Tiempo Real
```bash
# Si tienes Render CLI instalado
render logs -s gpt-chatbot-v0 --tail
```

### O desde el Dashboard
1. Dashboard → Tu Servicio → Logs
2. Observa los emojis en los logs:
   - 📋 Mensaje recibido
   - 🏢 Empresa encontrada
   - 👤 Usuario creado/obtenido
   - 💾 Datos guardados
   - ✅ Confirmación de guardado

---

## 🐛 Troubleshooting

### Problema: Los datos no persisten
**Causa:** Sistema de archivos efímero de Render
**Solución:** Activar Render Disk o migrar a MongoDB

### Problema: Error 404 en endpoints
**Causa:** El código no se desplegó correctamente
**Solución:** 
1. Verifica que el build terminó exitosamente
2. Revisa los logs de build en Render
3. Asegúrate de que `dist/` se generó correctamente

### Problema: No se ven los logs con emojis
**Causa:** El código viejo aún está corriendo
**Solución:** 
1. Fuerza un redeploy en Render
2. Verifica que el último commit se desplegó

---

## 📝 Checklist de Despliegue

- [ ] Código compilado localmente sin errores
- [ ] Commit y push realizados
- [ ] Build en Render completado exitosamente
- [ ] Servicio en estado "Live"
- [ ] Endpoint `/api/status` responde correctamente
- [ ] Logs con emojis visibles en Render
- [ ] Mensaje de prueba enviado y recibido
- [ ] Datos guardándose correctamente (verificar con `/api/status`)

---

## 🎯 Próximos Pasos

1. **Corto Plazo:**
   - ✅ Verificar que todo funciona
   - ✅ Monitorear logs
   - ⚠️ Decidir sobre persistencia de datos

2. **Mediano Plazo:**
   - 🔧 Implementar Render Disk o MongoDB
   - 🔐 Agregar autenticación a endpoints de status
   - 📊 Implementar métricas más detalladas

3. **Largo Plazo:**
   - 🗄️ Migración completa a base de datos
   - 📈 Dashboard de analytics
   - 🔔 Alertas automáticas
