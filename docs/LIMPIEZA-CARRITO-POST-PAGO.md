# Limpieza del Estado Global del Carrito Post-Pago

## 🎯 Problema Identificado

Cuando un cliente realiza un pago exitoso a través de MercadoPago, el webhook procesa el pago pero **el estado global del carrito no se limpiaba correctamente**, causando que el GPT quedara "bugeado" y no pudiera armar un nuevo carrito para futuras compras.

### Síntomas:
- ✅ Pago procesado correctamente
- ✅ Carrito en BD marcado como "pagado" y limpiado
- ❌ Variables globales del contacto NO se limpiaban
- ❌ GPT intentaba usar el carrito anterior al armar uno nuevo
- ❌ Cliente no podía hacer una segunda compra

---

## ✅ Solución Implementada

### 1. **Mejora del Webhook de MercadoPago**

**Archivo:** `backend/src/modules/mercadopago/routes/webhooksRoutes.ts`

#### Cambios Realizados:

**A. Búsqueda Mejorada del Contacto**

El webhook ahora intenta **múltiples variaciones** del teléfono para encontrar el contacto:

```typescript
// Normalizar teléfono del cliente para búsqueda
const telefonoCliente = carrito.telefono.replace(/\D/g, '');

// Intentar múltiples búsquedas
let contacto = await ContactoEmpresaModel.findOne({
  telefono: telefonoCliente,
  empresaId: carritoEmpresaId
});

// Si no se encuentra, intentar con prefijo +
if (!contacto) {
  contacto = await ContactoEmpresaModel.findOne({
    telefono: `+${telefonoCliente}`,
    empresaId: carritoEmpresaId
  });
}

// Si no se encuentra, intentar sin prefijo +
if (!contacto && carrito.telefono.startsWith('+')) {
  contacto = await ContactoEmpresaModel.findOne({
    telefono: carrito.telefono.substring(1).replace(/\D/g, ''),
    empresaId: carritoEmpresaId
  });
}
```

**B. Limpieza Completa del Estado Global**

Cuando se encuentra el contacto, se limpian **TODAS** las variables relacionadas con el carrito:

```typescript
// 🧹 LIMPIAR COMPLETAMENTE EL ESTADO DEL CARRITO
globalVars.carrito_items = [];
globalVars.carrito_total = 0;
globalVars.carrito_items_count = 0;
globalVars.carrito = undefined;
globalVars.carrito_id = undefined;
globalVars.accion_siguiente = undefined;
globalVars.tipo_accion = undefined;
globalVars.productos_carrito = undefined;
```

**C. Logs Mejorados**

El webhook ahora muestra logs claros sobre el proceso de limpieza:

```
[MP Webhook] 🔍 Buscando contacto - Teléfono: 5493794946066, EmpresaId: Veo Veo
[MP Webhook] ✅ Contacto encontrado - ID: 67890abc...
[MP Webhook] 📝 Limpiando estado global del carrito...
[MP Webhook] ✅ Estado global del carrito limpiado completamente
[MP Webhook] 🎯 El GPT ahora puede armar un nuevo carrito
```

Si no encuentra el contacto:
```
[MP Webhook] ⚠️ No se encontró contacto con teléfono 5493794946066 y empresaId Veo Veo
[MP Webhook] ⚠️ El estado global NO se pudo limpiar - el GPT puede quedar bugeado
```

---

## 🛠️ Scripts de Verificación y Limpieza

### 1. **Verificar Estado del Carrito**

**Script:** `backend/scripts/verificar-limpieza-carrito.mjs`

**Uso:**
```bash
cd backend
node scripts/verificar-limpieza-carrito.mjs [telefono] [empresaId]
```

**Ejemplo:**
```bash
node scripts/verificar-limpieza-carrito.mjs 5493794946066 "Veo Veo"
```

**Salida:**
```
🔍 VERIFICANDO ESTADO DEL CARRITO
==================================================
📞 Teléfono: 5493794946066
🏢 Empresa: Veo Veo

✅ Contacto encontrado
   ID: 67890abc...
   Nombre: Juan Pérez

📦 ESTADO DEL CARRITO:
==================================================
✅ carrito_items: LIMPIO
✅ carrito_total: LIMPIO
✅ carrito_items_count: LIMPIO
✅ carrito: LIMPIO
✅ carrito_id: LIMPIO
✅ accion_siguiente: LIMPIO
✅ tipo_accion: LIMPIO
✅ productos_carrito: LIMPIO

==================================================
✅ CARRITO COMPLETAMENTE LIMPIO
🎯 El GPT puede armar un nuevo carrito sin problemas
```

### 2. **Limpiar Carrito Manualmente**

**Script:** `backend/scripts/limpiar-carrito-manual.mjs`

**Uso:**
```bash
cd backend
node scripts/limpiar-carrito-manual.mjs <telefono> <empresaId>
```

**Ejemplo:**
```bash
node scripts/limpiar-carrito-manual.mjs 5493794946066 "Veo Veo"
```

**Salida:**
```
🧹 LIMPIEZA MANUAL DE CARRITO
==================================================
📞 Teléfono: 5493794946066
🏢 Empresa: Veo Veo

✅ Contacto encontrado
   ID: 67890abc...
   Nombre: Juan Pérez

🧹 Limpiando variables globales del carrito...
   ✅ carrito_items: limpiado
   ✅ carrito_total: limpiado
   ✅ carrito_items_count: limpiado
   ✅ carrito: limpiado
   ✅ carrito_id: limpiado
   ✅ accion_siguiente: limpiado
   ✅ tipo_accion: limpiado
   ✅ productos_carrito: limpiado
   ✅ 8 variables limpiadas y guardadas

🗄️ Limpiando carrito en base de datos...
   ✅ Carrito en BD limpiado

==================================================
✅ LIMPIEZA COMPLETADA
🎯 El GPT ahora puede armar un nuevo carrito sin problemas
```

---

## 🔄 Flujo Completo Post-Pago

### Antes de la Mejora:
```
1. Cliente paga → Webhook recibe notificación
2. Webhook marca carrito como "pagado" en BD
3. Webhook limpia items del carrito en BD
4. ❌ Variables globales NO se limpian
5. Cliente intenta nueva compra
6. 🐛 GPT usa variables del carrito anterior
7. ❌ No puede armar nuevo carrito
```

### Después de la Mejora:
```
1. Cliente paga → Webhook recibe notificación
2. Webhook marca carrito como "pagado" en BD
3. Webhook guarda items del carrito en Payment
4. Webhook limpia items del carrito en BD
5. ✅ Webhook busca contacto (múltiples intentos)
6. ✅ Webhook limpia TODAS las variables globales del carrito
7. ✅ Webhook marca carrito como "activo" y vacío
8. Cliente intenta nueva compra
9. ✅ GPT detecta carrito vacío
10. ✅ GPT puede armar nuevo carrito sin problemas
```

---

## 🧪 Cómo Probar

### Escenario de Prueba:

1. **Primera Compra:**
   ```
   Cliente: "Quiero comprar Harry Potter"
   Bot: [Busca producto, arma carrito, genera link de pago]
   Cliente: [Paga con MercadoPago]
   Bot: "🎉 ¡Tu pago fue aprobado!"
   ```

2. **Verificar Limpieza:**
   ```bash
   node scripts/verificar-limpieza-carrito.mjs 5493794946066 "Veo Veo"
   ```
   Debe mostrar: ✅ CARRITO COMPLETAMENTE LIMPIO

3. **Segunda Compra:**
   ```
   Cliente: "Ahora quiero El Principito"
   Bot: [Busca producto, arma NUEVO carrito, genera link de pago]
   ```
   ✅ El bot debe poder armar un nuevo carrito sin errores

---

## 🚨 Troubleshooting

### Problema: "No se encontró contacto"

**Causa:** El teléfono o empresaId no coinciden exactamente.

**Solución:**
1. Verificar el teléfono en la BD:
   ```bash
   node scripts/verificar-limpieza-carrito.mjs 5493794946066 "Veo Veo"
   ```

2. Intentar con diferentes formatos:
   ```bash
   node scripts/verificar-limpieza-carrito.mjs +5493794946066 "Veo Veo"
   node scripts/verificar-limpieza-carrito.mjs 3794946066 "Veo Veo"
   ```

3. Verificar el empresaId en MongoDB:
   ```javascript
   db.contacto_empresas.findOne({ telefono: /946066/ })
   ```

### Problema: "Carrito con datos residuales"

**Causa:** El webhook no pudo limpiar las variables globales.

**Solución:**
```bash
node scripts/limpiar-carrito-manual.mjs 5493794946066 "Veo Veo"
```

### Problema: "GPT sigue usando carrito anterior"

**Causa:** Las variables globales no se limpiaron correctamente.

**Solución:**
1. Limpiar manualmente:
   ```bash
   node scripts/limpiar-carrito-manual.mjs 5493794946066 "Veo Veo"
   ```

2. Verificar que se limpió:
   ```bash
   node scripts/verificar-limpieza-carrito.mjs 5493794946066 "Veo Veo"
   ```

3. Reiniciar conversación con el cliente

---

## 📊 Variables Globales Limpiadas

| Variable | Tipo | Valor Limpio | Descripción |
|----------|------|--------------|-------------|
| `carrito_items` | Array | `[]` | Lista de productos en el carrito |
| `carrito_total` | Number | `0` | Total del carrito |
| `carrito_items_count` | Number | `0` | Cantidad de items |
| `carrito` | Object | `undefined` | Objeto del carrito completo |
| `carrito_id` | String | `undefined` | ID del carrito en BD |
| `accion_siguiente` | String | `undefined` | Acción pendiente del GPT |
| `tipo_accion` | String | `undefined` | Tipo de acción del GPT |
| `productos_carrito` | Array | `undefined` | Productos extraídos por GPT |

---

## ✅ Checklist de Verificación

Después de un pago exitoso, verificar:

- [ ] Webhook recibió la notificación (logs del servidor)
- [ ] Carrito marcado como "pagado" en BD
- [ ] Items del carrito guardados en Payment
- [ ] Carrito limpiado en BD (items: [], total: 0, estado: 'activo')
- [ ] Contacto encontrado (logs: "✅ Contacto encontrado")
- [ ] Variables globales limpiadas (logs: "✅ Estado global del carrito limpiado")
- [ ] Script de verificación muestra "✅ CARRITO COMPLETAMENTE LIMPIO"
- [ ] Cliente puede armar un nuevo carrito sin errores

---

## 🎯 Resultado Final

✅ **Problema resuelto:** El GPT ahora puede armar múltiples carritos sin quedar bugeado después de un pago exitoso.

✅ **Mejoras implementadas:**
- Búsqueda mejorada del contacto con múltiples intentos
- Limpieza completa de TODAS las variables relacionadas con el carrito
- Logs claros para debugging
- Scripts de verificación y limpieza manual

✅ **Impacto:** Los clientes pueden realizar múltiples compras sin problemas, mejorando la experiencia de usuario y las ventas.
