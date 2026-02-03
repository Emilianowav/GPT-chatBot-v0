# Prompts con Cierre Profesional - Implementación Completa

## 📋 Resumen

Se actualizaron todos los prompts de los nodos GPT del flujo "Veo Veo" para que el bot **NUNCA deje al usuario esperando** con frases como "Déjame buscar eso para vos...". En su lugar, el bot da un **cierre profesional e inmediato** cuando no tiene información.

---

## ✅ Cambios Implementados

### 1. **Backend: Prompts Actualizados en MongoDB**

Se ejecutó el script `ajustar-prompts-cierre-profesional.mjs` que actualizó el prompt del nodo **`gpt-asistente-ventas`** con las siguientes reglas:

#### Reglas de Cierre Profesional:
```
🚨 CIERRE PROFESIONAL CUANDO NO TENÉS INFORMACIÓN:

Si el usuario pregunta algo que NO está en:
- El historial de conversación
- Los productos de WooCommerce
- Tus tópicos de información

ENTONCES:
✅ Da un cierre profesional INMEDIATO:
   "No tengo información sobre [tema] en este momento. ¿Te puedo ayudar con algo más?"

❌ NUNCA digas:
   - "Déjame buscar eso para vos..."
   - "Voy a consultar..."
   - "Dame un momento..."
   - Cualquier frase que deje al cliente esperando

✅ Ejemplos de cierre profesional:
   - "No tengo información de promos activas en este momento. ¿Te puedo ayudar con algo más?"
   - "No tengo información sobre envíos a esa zona. ¿Te puedo ayudar con algo más?"
   - "No tengo información sobre ese producto en este momento. ¿Te puedo ayudar con algo más?"
```

#### Nodos Actualizados:
- ✅ **gpt-asistente-ventas**: Actualizado con cierre profesional
- ⚠️ **gpt-clasificador-inteligente**: No se actualizó (no necesita cierre, solo clasifica)
- ⚠️ **gpt-formateador**: No se actualizó (no conversa con el usuario)
- ⚠️ **gpt-armar-carrito**: No se actualizó (no conversa con el usuario)

---

### 2. **Frontend: Editor de Prompts Habilitado**

Se agregó la capacidad de **editar el `extractionConfig.systemPrompt`** directamente desde el frontend en el editor de flujos.

#### Archivos Modificados:

**`GPTConfigPanel.tsx`**:
- Agregado `extractionConfig` a la interfaz `GPTConversacionalConfig`
- Agregado textarea para editar `extractionConfig.systemPrompt` en el tab "Extracción"
- El textarea tiene 12 filas y placeholder con ejemplos de reglas profesionales

**`NodeConfigPanel.tsx`**:
- Agregado `extractionConfig` al objeto `gptConfig` que se pasa al `GPTConfigPanel`
- Ahora el panel puede leer y guardar el `extractionConfig.systemPrompt`

#### Cómo Editar Prompts desde el Frontend:

1. **Abrir el editor de flujos** en el CRM
2. **Hacer clic en un nodo GPT** (ej: `gpt-asistente-ventas`)
3. **Ir al tab "Extracción"** (para nodos formateadores) o "Personalidad" (para conversacionales)
4. **Editar el textarea "System Prompt (Instrucciones para el GPT)"**
5. **Guardar los cambios**

El prompt se guarda en `node.data.config.extractionConfig.systemPrompt` en MongoDB.

---

## 🎯 Objetivo Logrado

### Antes:
```
Usuario: "¿Tienen promos?"
Bot: "Déjame buscar eso para vos..." ⏳
[Usuario queda esperando indefinidamente]
```

### Después:
```
Usuario: "¿Tienen promos?"
Bot: "No tengo información de promos activas en este momento. ¿Te puedo ayudar con algo más?" ✅
[Conversación continúa profesionalmente]
```

---

## 📂 Scripts Creados

### `backend/scripts/ajustar-prompts-cierre-profesional.mjs`
Script que actualiza los prompts en MongoDB con las reglas de cierre profesional.

**Uso:**
```bash
cd backend
node scripts/ajustar-prompts-cierre-profesional.mjs
```

**Salida:**
```
🔧 AJUSTANDO PROMPTS CON CIERRE PROFESIONAL
✅ Asistente de Ventas actualizado
✅ TODOS LOS PROMPTS ACTUALIZADOS CON CIERRE PROFESIONAL
```

### `backend/scripts/ver-estructura-nodos-gpt.mjs`
Script para verificar la estructura de los nodos GPT y confirmar que tienen `extractionConfig.systemPrompt`.

**Uso:**
```bash
cd backend
node scripts/ver-estructura-nodos-gpt.mjs
```

---

## 🔍 Verificación

Para verificar que los prompts están correctos:

1. **Ver prompts actuales:**
   ```bash
   cd backend
   node scripts/ver-todos-prompts-gpt-veo-veo.mjs
   ```

2. **Verificar estructura:**
   ```bash
   cd backend
   node scripts/ver-estructura-nodos-gpt.mjs
   ```

3. **Probar en WhatsApp:**
   - Enviar mensaje: "¿Tienen promos?"
   - Verificar que el bot responde con cierre profesional
   - Verificar que NO dice "déjame buscar..."

---

## 📝 Notas Importantes

1. **Genérico para cualquier situación**: Las reglas de cierre profesional aplican a CUALQUIER pregunta donde el bot no tenga información, no solo promos.

2. **Tono profesional y amigable**: El bot mantiene su personalidad amigable pero es honesto sobre sus limitaciones.

3. **Siempre ofrece ayuda alternativa**: Después del cierre, el bot pregunta "¿Te puedo ayudar con algo más?" para mantener la conversación activa.

4. **Editable desde frontend**: Los prompts se pueden modificar desde el editor de flujos sin necesidad de scripts.

5. **Compatibilidad**: Los cambios son compatibles con el sistema existente y no afectan otros nodos del flujo.

---

## 🚀 Próximos Pasos (Opcional)

Si querés aplicar estas reglas a otros nodos GPT:

1. Abrir el editor de flujos
2. Seleccionar el nodo GPT que querés modificar
3. Ir al tab correspondiente (Personalidad o Extracción)
4. Editar el System Prompt agregando las reglas de cierre profesional
5. Guardar

O ejecutar el script `ajustar-prompts-cierre-profesional.mjs` modificado para incluir otros nodos.

---

## ✅ Estado Final

- ✅ Prompts actualizados en backend (MongoDB)
- ✅ Frontend permite editar prompts desde el editor
- ✅ Bot da cierre profesional cuando no tiene información
- ✅ Bot NO deja al usuario esperando
- ✅ Scripts de verificación disponibles
- ✅ Documentación completa

**Todo funcionando correctamente. El bot ahora maneja profesionalmente las situaciones donde no tiene información disponible.**
