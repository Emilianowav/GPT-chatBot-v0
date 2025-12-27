# Análisis: Workflow BD vs Código Hardcodeado

## Estado Actual del Flujo de Juventus

### ✅ Lo que YA está en la BD (correcto):

| Elemento | Ubicación | Estado |
|----------|-----------|--------|
| Mensajes de cada paso | `workflow.steps[].pregunta` | ✅ OK |
| Validaciones | `workflow.steps[].validacion` | ✅ OK |
| Mapeo de opciones | `workflow.steps[].validacion.mapeo` | ✅ OK |
| Mapeo de parámetros API | `workflow.steps[].mapeoParametros` | ✅ OK |
| Endpoints | `workflow.steps[].endpointId` | ✅ OK |
| Trigger keywords | `workflow.trigger.keywords` | ✅ OK |
| Mensaje inicial | `workflow.mensajeInicial` | ✅ OK |

### ⚠️ Lógica HARDCODEADA en el código:

#### 1. Seña fija de $1
**Archivo:** `workflowConversationalHandler.ts`
**Líneas:** 894, 1261
```typescript
const seña = 1; // Seña mínima de $1 (mínimo de Mercado Pago)
```
**Recomendación:** Mover a configuración del workflow o endpoint:
```json
{
  "endpointId": "generar-link-pago",
  "config": {
    "seña": 1,
    "porcentajeSeña": 0.5
  }
}
```

#### 2. Mapeo de deporte numérico a nombre
**Archivo:** `workflowConversationalHandler.ts`
**Líneas:** 971-975
```typescript
if (paramName === 'deporte' && (valorTransformado === '1' || valorTransformado === '2')) {
  const mapeoDeporte: Record<string, string> = { '1': 'paddle', '2': 'futbol' };
  ...
}
```
**Estado:** ✅ YA está en BD en `validacion.mapeo`, pero el código tiene un fallback hardcodeado.
**Recomendación:** Eliminar el fallback del código, confiar solo en la BD.

#### 3. Detección de paso de confirmación
**Archivo:** `workflowConversationalHandler.ts`
**Línea:** 612
```typescript
if (paso.nombreVariable === 'confirmacion') {
  return await this.procesarConfirmacion(...);
}
```
**Estado:** ⚠️ Detecta por nombre de variable, no por tipo de paso.
**Recomendación:** Usar `paso.tipo === 'confirmacion'` en lugar de `nombreVariable`.

#### 4. Mensajes de link de pago
**Archivo:** `workflowConversationalHandler.ts`
**Líneas:** 1264-1272
```typescript
response = `💳 *Link de pago generado*\n\n`;
response += `💵 *Precio total:* $${precioTotal}\n`;
response += `💰 *Seña a pagar:* $${seña}\n\n`;
...
```
**Recomendación:** Mover a plantilla en el paso del workflow:
```json
{
  "orden": 9,
  "nombre": "Generar link de pago",
  "mensajeExito": "💳 *Link de pago generado*\n\n💵 *Precio total:* ${{precio_total}}\n💰 *Seña a pagar:* ${{seña}}\n\n👉 *Completá el pago aquí:*\n{{link_pago}}\n\n⏰ Tenés 10 minutos para completar el pago."
}
```

#### 5. Lógica de matching de disponibilidad
**Archivo:** `workflowConversationalHandler.ts`
**Líneas:** ~1100-1200
**Estado:** Lógica específica para matching de canchas por hora/duración.
**Recomendación:** Esta lógica es específica del dominio (canchas) y podría abstraerse, pero es aceptable tenerla en código si es reutilizable.

---

## Resumen de Acciones Recomendadas

### Prioridad Alta (Afecta funcionalidad):
1. ✅ **Mapeo de deporte** - Ya está en BD, eliminar fallback del código
2. ⚠️ **Seña** - Mover a configuración del endpoint o workflow

### Prioridad Media (Mejora mantenibilidad):
3. ⚠️ **Mensajes de pago** - Mover a plantilla en BD
4. ⚠️ **Detección de confirmación** - Usar `tipo` en lugar de `nombreVariable`

### Prioridad Baja (Opcional):
5. ℹ️ **Lógica de matching** - Mantener en código (es lógica de negocio compleja)

---

## Conclusión

El workflow de Juventus está **80% configurado en BD**, lo cual es bueno. Los principales elementos hardcodeados son:
- Valor de la seña ($1)
- Mensajes del link de pago
- Algunos fallbacks de mapeo

Para un sistema 100% configurable, estos elementos deberían moverse a la BD, pero el estado actual es funcional y mantenible.
