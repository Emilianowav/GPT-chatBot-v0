# Diagnóstico: extractionConfig No Se Ejecuta

## 🔴 Problema Actual

El nodo `gpt-carrito` NO está generando las variables `carrito` y `accion_siguiente` como variables globales.

### Output Actual del GPT:
```json
{
  "respuesta_gpt": "...accion_siguiente: pagar...",
  "tokens": 3554,
  "costo": 0.11106
}
```

### Output Esperado:
```json
{
  "respuesta_gpt": "...",
  "tokens": 3554,
  "costo": 0.11106,
  "carrito": {
    "productos": [...],
    "total": 48800
  },
  "accion_siguiente": "pagar"
}
```

## 🔍 Causa Raíz

Los logs NO muestran los mensajes de debug que agregamos en `FlowExecutor.ts`:
- ❌ NO aparece: `config.outputFormat === 'structured': true`
- ❌ NO aparece: `config.extractionConfig?.enabled: true`
- ❌ NO aparece: `🔧 Usando extractionConfig del frontend`

**Esto significa que el servidor en Render está usando la versión VIEJA del código.**

## 📋 Configuración del Nodo (Correcta en MongoDB)

```javascript
{
  id: 'gpt-carrito',
  type: 'gpt',
  data: {
    config: {
      tipo: 'conversacional',
      outputFormat: 'structured',  // ✅ Correcto
      extractionConfig: {
        enabled: true,              // ✅ Correcto
        systemPrompt: '...',        // ✅ Correcto
        fields: [
          { name: 'carrito', type: 'object', required: false },
          { name: 'accion_siguiente', type: 'string', required: true }
        ]
      },
      globalVariablesOutput: ['carrito', 'accion_siguiente']  // ✅ Correcto
    }
  }
}
```

## 🔧 Cambio Aplicado en FlowExecutor.ts

### Línea 731 (NUEVA):
```typescript
if ((config.tipo === 'formateador' || config.outputFormat === 'structured') && 
    config.extractionConfig?.enabled && 
    config.extractionConfig?.systemPrompt) {
```

### Línea 731 (VIEJA - que Render está usando):
```typescript
if (config.tipo === 'formateador' && config.extractionConfig?.systemPrompt) {
```

## ✅ Solución

### Opción 1: Verificar Despliegue en Render
1. Ir a: https://dashboard.render.com
2. Verificar que el último deploy se completó exitosamente
3. Ver logs de build para confirmar que compiló correctamente

### Opción 2: Forzar Rebuild Manual
Si el deploy automático falló:
1. En Render Dashboard → tu servicio
2. Click en "Manual Deploy" → "Deploy latest commit"
3. Esperar 2-3 minutos

### Opción 3: Verificar Commit en GitHub
Confirmar que el commit `41cdaf0` está en GitHub:
```bash
git log --oneline -1
# Debe mostrar: 41cdaf0 fix: Corregir extracción de variables...
```

## 🧪 Cómo Verificar que Funciona

Después del rebuild, los logs deberían mostrar:

```
🔍 [DEBUG] Verificando condición de extracción:
   config.tipo === 'formateador': false
   config.outputFormat === 'structured': true  ← DEBE APARECER
   config.extractionConfig existe: true
   config.extractionConfig?.systemPrompt existe: true
   config.extractionConfig?.enabled: true      ← DEBE APARECER
   Condición completa: true                    ← DEBE SER TRUE

   🔧 Usando extractionConfig del frontend    ← DEBE APARECER
```

Y el output del nodo `gpt-carrito` debe incluir:
```json
{
  "carrito": { "productos": [...], "total": 48800 },
  "accion_siguiente": "pagar"
}
```

## 📊 Variables Globales Esperadas

Después de ejecutar `gpt-carrito`:
```
globalVariables actuales: [
  "telefono_cliente",
  "telefono_empresa", 
  "phoneNumberId",
  "mensaje_usuario",
  "tipo_accion",
  "confianza",
  "variables_completas",
  "variables_faltantes",
  "carrito",           ← DEBE APARECER
  "accion_siguiente"   ← DEBE APARECER
]
```
