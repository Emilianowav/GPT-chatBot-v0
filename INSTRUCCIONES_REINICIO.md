# 🔄 INSTRUCCIONES PARA REINICIAR CORRECTAMENTE

## ⚠️ PROBLEMA

El backend está usando código compilado ANTIGUO (antes de los cambios).

**Evidencia:**
```
Error en: dist/modules/integrations/controllers/apiConfigController.js:557
```

Este es el archivo compilado que NO tiene la migración automática.

---

## ✅ SOLUCIÓN

### **1. Detener el Backend Actual**

Si está corriendo, presiona `Ctrl+C` en la terminal del backend.

---

### **2. Reiniciar con npm run dev**

```bash
cd backend
npm run dev
```

**NO uses `npm start`** - ese comando usa código compilado antiguo.

**USA `npm run dev`** - ese comando usa ts-node y ejecuta el código TypeScript directamente.

---

### **3. Verificar que Cargó Correctamente**

Deberías ver en los logs:
```
✅ [WORKFLOW] API encontrada: ...
🔄 Migrando paso "..." de 'ejecutar' a 'consulta_filtrada'
```

---

## 🎯 COMANDOS CORRECTOS

### **Backend:**
```bash
cd backend
npm run dev    # ← CORRECTO (usa ts-node, código actualizado)
```

### **Frontend:**
```bash
cd front_crm/bot_crm
npm run dev    # ← Ya está corriendo
```

---

## 🔍 DIFERENCIA

### `npm start` (❌ INCORRECTO)
```
1. Ejecuta: npm run build
2. Compila TypeScript → JavaScript en /dist
3. Ejecuta: node dist/app.js
4. Usa código COMPILADO (puede ser antiguo)
```

### `npm run dev` (✅ CORRECTO)
```
1. Ejecuta: nodemon con ts-node
2. Lee TypeScript directamente
3. Recarga automáticamente en cambios
4. Usa código ACTUAL
```

---

## 📝 PASOS COMPLETOS

1. **Detén el backend** (Ctrl+C si está corriendo)
2. **Abre terminal en backend:**
   ```bash
   cd c:\Users\momen\Desktop\Projects\GPT-chatBot-v0\backend
   ```
3. **Ejecuta:**
   ```bash
   npm run dev
   ```
4. **Espera a ver:**
   ```
   🚀 Servidor iniciado en puerto 3000
   ✅ MongoDB conectado
   ```
5. **Desde el frontend, guarda el workflow nuevamente**

---

## ✅ RESULTADO ESPERADO

Cuando guardes el workflow, verás en los logs del backend:
```
🔵 [REQUEST] PUT /api/modules/integrations/iCenter/apis/.../workflows/...
🔄 Migrando paso "consulta_productos" de 'ejecutar' a 'consulta_filtrada'
💾 [WORKFLOW] API guardada exitosamente
✅ Workflow actualizado exitosamente
```

**¡Sin errores!** 🎉

---

## 🆘 SI AÚN NO FUNCIONA

Ejecuta esto para limpiar y recompilar:
```bash
cd backend
rm -rf dist node_modules
npm install
npm run dev
```

---

**IMPORTANTE: Usa `npm run dev` para el backend, NO `npm start`**
