# 🔄 MIGRACIÓN: Tipo de Paso 'ejecutar' → 'consulta_filtrada'

## ⚠️ PROBLEMA

Si ves este error:
```
ApiConfiguration validation failed: workflows.0.steps.4.tipo: 
`ejecutar` is not a valid enum value for path `tipo`.
```

Significa que tienes un workflow con el tipo de paso antiguo `'ejecutar'` que necesita ser actualizado a `'consulta_filtrada'`.

---

## ✅ SOLUCIÓN RÁPIDA

### **Opción 1: Desde el Frontend (Recomendado)**

1. **Abre el workflow en el editor**
2. **Busca el paso con error** (tipo "ejecutar")
3. **Cambia el tipo a "Consulta Filtrada"** en el selector
4. **Guarda el workflow**

El frontend ahora usa el tipo correcto automáticamente.

---

### **Opción 2: Limpiar Caché del Navegador**

Si el workflow está guardado en localStorage:

1. Abre DevTools (F12)
2. Application → Storage → Clear site data
3. Recarga la página
4. Vuelve a crear el workflow

---

### **Opción 3: Script de Migración (Si hay datos en DB)**

Si tienes workflows guardados en la base de datos:

```bash
cd backend
npm run migrate:ejecutar-to-consulta
```

Este script:
- ✅ Busca todos los pasos con tipo 'ejecutar'
- ✅ Los cambia a 'consulta_filtrada'
- ✅ Agrega campo `origenDatos='resultado'` a endpoints relacionados
- ✅ Actualiza la base de datos automáticamente

---

## 📊 VERIFICAR MIGRACIÓN

Para ver el estado de tus workflows:

```bash
cd backend
npm run inspect-db
```

Esto mostrará:
- Todas las colecciones
- Todos los workflows
- Tipos de pasos
- Warnings si encuentra tipo 'ejecutar'

---

## 🔍 BUSCAR DOCUMENTO ESPECÍFICO

Si conoces el ID del workflow con problema:

```bash
cd backend
npm run find-doc
```

Edita `src/scripts/findDocument.ts` y cambia:
```typescript
const TARGET_ID = '6917126a03862ac8bb3fd4f2'; // Tu ID aquí
```

---

## 🛠️ SCRIPTS DISPONIBLES

```bash
# Migrar tipo 'ejecutar' a 'consulta_filtrada'
npm run migrate:ejecutar-to-consulta

# Actualizar TODOS los workflows (forzado)
npm run force-update-workflows

# Inspeccionar base de datos
npm run inspect-db

# Buscar documento específico
npm run find-doc
```

---

## 📝 CAMBIOS REALIZADOS

### **Backend:**
- ✅ Enum actualizado: `'ejecutar'` → `'consulta_filtrada'`
- ✅ Schema actualizado con nuevo tipo
- ✅ Scripts de migración creados

### **Frontend:**
- ✅ Tipo actualizado en interfaces
- ✅ UI actualizada con nuevo nombre
- ✅ Selectores usan 'consulta_filtrada'

---

## 🎯 PREVENCIÓN

Para evitar este error en el futuro:

1. **Siempre usa el selector de tipo** en el editor de workflows
2. **No edites manualmente** el JSON de workflows
3. **Actualiza el frontend** antes de crear nuevos workflows

---

## 💡 NOTA IMPORTANTE

El cambio de nombre refleja mejor la funcionalidad:
- ❌ **"ejecutar"** → Genérico y confuso
- ✅ **"consulta_filtrada"** → Describe exactamente qué hace

**Beneficios:**
- Más claro para los usuarios
- Mejor documentación
- Código más mantenible

---

## 🆘 SI NADA FUNCIONA

1. **Elimina el workflow problemático** desde el frontend
2. **Créalo nuevamente** usando el editor actualizado
3. **Usa el tipo "Consulta Filtrada"** desde el principio

El nuevo workflow se guardará con el tipo correcto automáticamente.

---

**¡La migración es automática! El frontend ya usa el tipo correcto.** 🚀
