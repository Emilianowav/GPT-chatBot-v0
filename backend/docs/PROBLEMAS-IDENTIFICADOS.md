# Problemas Identificados en el Flujo

**Fecha:** 2026-01-10
**Flujo:** Veo Veo Libros (695a156681f6d67f0ae9cf40)

---

## 🔴 PROBLEMA 1: Historial vacío (0 mensajes)

**Descripción:**
El contacto 5493794946066 tiene 0 mensajes en `conversaciones.historial`.

**Impacto:**
- El GPT Formateador (nodo 3) no puede extraer variables porque no hay conversación para analizar
- El router siempre evalúa `{{titulo}} not exists` como TRUE porque no hay datos extraídos

**Causa raíz:**
El historial fue limpiado con el script `limpiar-historial-emiliano.cjs` pero no se ha ejecutado ninguna conversación nueva.

**Solución:**
Ejecutar una conversación real desde WhatsApp para que:
1. GPT Conversacional guarde mensajes en el historial
2. GPT Formateador pueda extraer variables del historial
3. Router pueda evaluar correctamente las condiciones

**Estado:** ⚠️ Requiere ejecución real del flujo

---

## 🔴 PROBLEMA 2: Flujo de variables no funciona correctamente

**Descripción:**
El flujo esperado es:
```
Webhook → GPT Conversacional → GPT Formateador → Router
```

Pero las variables extraídas por GPT Formateador no están disponibles cuando el Router evalúa las condiciones.

**Impacto:**
- Router siempre toma la ruta "Faltan datos" (route-1)
- Nunca llega a WooCommerce (route-2)

**Causa raíz:**
El GPT Formateador extrae `{titulo, editorial, edicion}` pero estas variables no se están guardando como **variables globales** para que el router las pueda evaluar.

**Verificación necesaria:**
Revisar `FlowExecutor.ts` para confirmar que las variables extraídas se guardan en `this.globalVariables`.

**Estado:** 🔍 Requiere análisis del código

---

## ✅ PROBLEMA 3: Parámetros de WooCommerce incorrectos

**Descripción:**
El nodo WooCommerce tenía parámetros incorrectos:
```json
{
  "search": "{{busqueda}}",  // ❌ Variable que no existe
  "category": "{{categoria}}" // ❌ Variable que no existe
}
```

**Impacto:**
WooCommerce no podía buscar productos porque las variables no existían.

**Solución aplicada:**
```json
{
  "search": "{{titulo}}",
  "per_page": "10",
  "orderby": "relevance",
  "status": "publish"
}
```

**Estado:** ✅ CORREGIDO

---

## ✅ PROBLEMA 4: Campo "instrucciones" hardcodeado

**Descripción:**
El nodo GPT Conversacional tenía un campo `instrucciones` hardcodeado en MongoDB que sobrescribía la lógica automática de construcción del systemPrompt.

**Impacto:**
Los cambios desde el frontend no se reflejaban porque el campo `instrucciones` tenía prioridad.

**Solución aplicada:**
Eliminado el campo `instrucciones` de todos los nodos GPT. Ahora el systemPrompt se construye automáticamente desde:
- `personalidad` (desde frontend)
- `topicos` (desde frontend)
- `variablesRecopilar` (desde frontend)

**Estado:** ✅ CORREGIDO

---

## ✅ PROBLEMA 5: Nodos GPT sin configuración

**Descripción:**
Los nodos `gpt-pedir-datos` y `gpt-resultados` no tenían personalidad, tópicos ni variables configuradas.

**Impacto:**
Usaban el fallback "Eres un asistente útil." que no es apropiado para su función.

**Solución aplicada:**
Configurados con `systemPrompt` legacy apropiado para cada función:
- `gpt-pedir-datos`: Pide título del libro si falta
- `gpt-resultados`: Formatea productos de WooCommerce para WhatsApp

**Estado:** ✅ CORREGIDO

---

## ✅ PROBLEMA 6: Router edges incorrectos

**Descripción:**
Los edges del router no tenían `routeId` ni `routeLabel` correctamente configurados.

**Impacto:**
El router no podía encontrar el edge correcto para la ruta seleccionada.

**Solución aplicada:**
Corregidos los edges:
- `route-1` (Faltan datos) → `gpt-pedir-datos` ✅
- `route-2` (Datos completos) → `woocommerce` ✅

**Estado:** ✅ CORREGIDO

---

## 📋 RESUMEN DE CONFIGURACIÓN ACTUAL

### Nodos GPT:

1. **gpt-conversacional**
   - SystemPrompt: CONSTRUIDO AUTOMÁTICAMENTE
   - Desde: `personalidad` + `topicos` (4) + `variablesRecopilar` (3)
   - Variables: titulo, editorial, edicion (OBLIGATORIAS)

2. **gpt-formateador**
   - SystemPrompt: CONSTRUIDO AUTOMÁTICAMENTE
   - Desde: `configuracionExtraccion`
   - Extrae: titulo, editorial, edicion del historial

3. **gpt-pedir-datos**
   - SystemPrompt: LEGACY (guardado en BD)
   - Función: Pedir título si falta

4. **gpt-resultados**
   - SystemPrompt: LEGACY (guardado en BD)
   - Función: Formatear productos de WooCommerce

### Router:

- **route-1** (Faltan datos): `{{titulo}} not exists` → gpt-pedir-datos
- **route-2** (Datos completos): `{{titulo}} exists` → woocommerce

### WooCommerce:

- Parámetros: `search={{titulo}}`, `per_page=10`, `orderby=relevance`

---

## 🔍 PRÓXIMOS PASOS

1. ✅ Verificar que `FlowExecutor` guarda variables extraídas como globales
2. ⚠️ Ejecutar conversación real desde WhatsApp para generar historial
3. ⚠️ Verificar que router evalúa correctamente con variables globales
4. ⚠️ Verificar que WooCommerce recibe `{{titulo}}` correctamente resuelto

---

## 📊 ESTADO GENERAL

| Componente | Estado | Notas |
|------------|--------|-------|
| GPT Conversacional | ✅ OK | Construye systemPrompt automáticamente |
| GPT Formateador | ⚠️ Revisar | Necesita historial para extraer variables |
| Router | ✅ OK | Edges corregidos |
| WooCommerce | ✅ OK | Parámetros corregidos |
| Variables globales | 🔍 Revisar | Verificar propagación de variables extraídas |
| Historial | ⚠️ Vacío | Requiere ejecución real del flujo |
