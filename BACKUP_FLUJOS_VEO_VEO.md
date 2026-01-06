# BACKUP - Flujos de Veo Veo en BD (Antes de Migración a Flujos Visuales)

**Fecha:** 5 de Enero 2026, 17:42 hs
**Empresa:** Veo Veo
**EmpresaId MongoDB:** 6940a9a181b92bfce970fdb5

---

## FLUJOS ENCONTRADOS EN BD

### Flujo 1: `695a156681f6d67f0ae9cf39`
**Nombre:** Veo Veo - Asistente GPT Conversacional
**Estado:** Activo
**Tipo:** Legacy (sin nodes/edges visuales)
**Nodos:** 2 (antes de actualización)
**Edges:** 1

**Problema:** Este flujo NO tiene `category: 'trigger'` en sus nodos, causando error en FlowExecutor.

**Acción:** Se intentó actualizar a 3 nodos con structure visual, pero parece que no se aplicó correctamente.

---

### Flujo 2: `695bfb65eb842c147f7c5fff`
**Nombre:** Ejemplo Router - Flujo con Bifurcación (actualizado a "Veo Veo - Consultar Libros")
**Estado:** Activo
**Nodos:** 6 → 3 (actualizado)
**Edges:** 5 → 2 (actualizado)

**Acción:** Se actualizó con script `actualizar-flujo-produccion.js` pero este NO es el flujo que se está ejecutando en producción.

---

## PROBLEMA IDENTIFICADO

El `whatsappController` busca flujos con:
```javascript
const flowVisual = await FlowModel.findOne({ 
  empresaId: empresaMongoId,
  activo: true 
});
```

**Sin discriminador de tipo**, toma el primer flujo activo que encuentra, que puede ser:
- Flujo legacy (sin estructura visual correcta)
- Flujo visual nuevo (con nodes/edges y categories)

---

## SOLUCIÓN PROPUESTA

### 1. Agregar campo `botType` a los flujos
```javascript
{
  botType: 'visual',  // Para flujos nuevos visuales
  botType: 'legacy',  // Para flujos viejos
  botType: 'steps'    // Para bot de pasos existente
}
```

### 2. Modificar query en whatsappController
```javascript
const flowVisual = await FlowModel.findOne({ 
  empresaId: empresaMongoId,
  activo: true,
  botType: 'visual'  // ← SOLO flujos visuales
});
```

### 3. Desactivar flujos legacy de Veo Veo
- Desactivar flujo `695a156681f6d67f0ae9cf39` (legacy)
- Mantener solo flujo visual nuevo

---

## FLUJOS A MANTENER ACTIVOS

### Para Veo Veo:
- **1 flujo visual** con estructura correcta (3 nodos con trigger)
- `botType: 'visual'`
- `activo: true`

### Para otras empresas:
- Mantener sus flujos legacy con `botType: 'legacy'`
- No afectar su funcionamiento actual

---

## SCRIPTS EJECUTADOS

1. `crear-flujo-veo-veo-minimo.js` - Creó flujo con 3 nodos (local)
2. `actualizar-flujo-produccion.js` - Actualizó flujo `695bfb65eb842c147f7c5fff` (no el correcto)
3. `actualizar-flujo-produccion-remoto.js` - Mismo resultado
4. `fix-flujo-produccion-correcto.js` - Intentó actualizar `695a156681f6d67f0ae9cf39` pero no se reflejó

---

## PRÓXIMOS PASOS

1. ✅ Documentar estado actual (este archivo)
2. ⏳ Agregar campo `botType` al modelo Flow
3. ⏳ Crear flujo visual limpio para Veo Veo con `botType: 'visual'`
4. ⏳ Desactivar flujos legacy de Veo Veo
5. ⏳ Modificar whatsappController para filtrar por `botType: 'visual'`
6. ⏳ Testear flujo visual funcionando

---

**IMPORTANTE:** No eliminar flujos, solo desactivarlos (`activo: false`) para poder restaurarlos si es necesario.
