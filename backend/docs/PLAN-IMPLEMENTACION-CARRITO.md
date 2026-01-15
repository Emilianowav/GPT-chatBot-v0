# 🛒 Plan de Implementación - Funcionalidad de Carrito

**FECHA:** 2026-01-15  
**ESTADO:** 📋 PLANIFICADO - NO INICIADO  
**PRIORIDAD:** 🔴 CRÍTICA - NO PERDER FLUJO ACTUAL

---

## ⚠️ REGLAS DE ORO

### **🚫 PROHIBIDO:**
1. Modificar nodos existentes (1-6)
2. Cambiar conexiones existentes
3. Modificar prompts actuales sin backup
4. Eliminar variables globales existentes
5. Cambiar lógica de WooCommerce actual

### **✅ PERMITIDO:**
1. Agregar nodos NUEVOS después del nodo 6
2. Crear variables globales NUEVAS
3. Agregar tópicos NUEVOS
4. Crear servicios NUEVOS (MercadoPago, etc.)
5. Agregar webhooks NUEVOS

---

## 📊 Estrategia de Implementación

### **Fase 1: Backup y Preparación** ✅ COMPLETADO

- [x] Crear documentación completa del flujo actual
- [x] Crear script de backup de MongoDB
- [x] Crear script de restauración
- [ ] Ejecutar backup antes de cualquier cambio
- [ ] Crear branch de Git
- [ ] Commit del estado actual

---

### **Fase 2: Implementación Backend (Sin Tocar Flujo)**

#### **2.1. Servicios Nuevos**

**A. MercadoPago Service**
- [ ] Crear `backend/src/services/MercadoPagoService.ts`
- [ ] Implementar `createPreference()`
- [ ] Implementar `getPayment()`
- [ ] Agregar variables de entorno
- [ ] Probar en sandbox

**B. Webhook Handler**
- [ ] Crear `backend/src/routes/webhooks.ts`
- [ ] Implementar endpoint `/webhook/mercadopago`
- [ ] Integrar con WhatsApp Service
- [ ] Agregar logs detallados
- [ ] Probar con ngrok

---

### **Fase 3: Nodos Nuevos (Sin Modificar Existentes)**

#### **3.1. GPT Clasificador Inteligente**

**Nodo ID:** `gpt-clasificador-inteligente`

**Posición en el flujo:** ANTES del nodo 2 (Formateador)

**Propósito:** Decidir si el mensaje es búsqueda o compra

**Variables de entrada:**
- `{{1.message}}` (mensaje del usuario)
- `{{historial_conversacion}}` (historial completo)
- `{{global.productos_presentados}}` (productos previos)
- `{{global.carrito_en_progreso}}` (carrito actual)

**Variables de salida:**
- `tipo_accion` (string): "buscar_producto", "comprar", "consultar", "despedida"
- `confianza` (number): 0-1
- `razonamiento` (string)
- `detalles` (object)

**Conexiones:**
- Entrada: Desde nodo 1 (Trigger)
- Salida: A Router Principal (nuevo)

**⚠️ IMPORTANTE:** Este nodo NO reemplaza el formateador, se agrega ANTES

---

#### **3.2. Router Principal**

**Nodo ID:** `router-principal`

**Posición:** Entre Clasificador y Formateador

**Condiciones:**
```javascript
// Ruta 1: Búsqueda (flujo actual)
tipo_accion equals "buscar_producto" → nodo 2 (Formateador existente)

// Ruta 2: Compra (flujo nuevo)
tipo_accion equals "comprar" → gpt-armar-carrito (nuevo)

// Ruta 3: Consulta
tipo_accion equals "consultar" → gpt-conversacional-topicos (nuevo)

// Ruta 4: Despedida
tipo_accion equals "despedida" → whatsapp-despedida (nuevo)
```

**⚠️ CRÍTICO:** La ruta "buscar_producto" debe ir al nodo 2 existente (Formateador)

---

#### **3.3. GPT Armar Carrito**

**Nodo ID:** `gpt-armar-carrito`

**Posición:** Rama paralela al flujo de búsqueda

**Variables de entrada:**
- `{{historial_conversacion}}`
- `{{global.productos_presentados}}`
- `{{1.message}}`

**Variables de salida:**
- `productos_carrito` (array)
- `total` (number)
- `confirmacion_compra` (boolean) ⚠️ OBLIGATORIO
- `nombre_cliente` (string)
- `email_cliente` (string)
- `telefono_cliente` (string)

**Conexiones:**
- Entrada: Desde Router Principal
- Salida: A Router Carrito (nuevo)

---

#### **3.4. Router Carrito**

**Nodo ID:** `router-carrito`

**Condiciones:**
```javascript
// Ruta 1: Carrito completo
confirmacion_compra equals true AND 
nombre_cliente exists AND 
email_cliente exists 
→ mercadopago-crear-preference (nuevo)

// Ruta 2: Faltan datos (default)
→ whatsapp-solicitar-datos (nuevo)
```

---

#### **3.5. Nodo MercadoPago**

**Nodo ID:** `mercadopago-crear-preference`

**Tipo:** Custom/API

**Configuración:**
```json
{
  "module": "create-preference",
  "items": "{{productos_carrito}}",
  "payer": {
    "name": "{{nombre_cliente}}",
    "email": "{{email_cliente}}",
    "phone": "{{telefono_cliente}}"
  },
  "notification_url": "https://tu-backend.com/webhook/mercadopago",
  "external_reference": "{{1.from}}_{{timestamp}}"
}
```

**Variables de salida:**
- `preference_id` (string)
- `init_point` (string) - URL de pago
- `external_reference` (string)

---

#### **3.6. WhatsApp Solicitar Datos**

**Nodo ID:** `whatsapp-solicitar-datos`

**Mensaje dinámico:**
```javascript
{{#if (not confirmacion_compra)}}
¿Confirmás tu compra? 🛒
[Lista de productos]
💰 Total: ${{total}}
Respondé "sí" para continuar
{{else}}
Para completar necesito:
{{#if (not nombre_cliente)}}- Tu nombre{{/if}}
{{#if (not email_cliente)}}- Tu email{{/if}}
{{/if}}
```

---

#### **3.7. WhatsApp Link Pago**

**Nodo ID:** `whatsapp-link-pago`

**Mensaje:**
```
¡Perfecto! 🎉

Tu pedido:
{{#each productos_carrito}}
📖 {{nombre}} - ${{precio}}
{{/each}}
──────────────────────
💰 Total: ${{total}}

👉 Pagá aquí: {{mercadopago.init_point}}

Te avisamos cuando se confirme el pago 📦
```

---

### **Fase 4: Modificación Mínima al Flujo Actual**

#### **4.1. Actualizar Mensaje del GPT Asistente (Nodo 5)**

**⚠️ ÚNICA MODIFICACIÓN AL FLUJO ACTUAL**

**Agregar al final del systemPrompt:**
```
IMPORTANTE: Al final de tu respuesta, SIEMPRE incluye:

"¿Qué te gustaría hacer ahora?
🛒 Comprar alguno de estos libros
🔍 Buscar otro libro
💬 Hacer una consulta"
```

**Backup antes de modificar:**
```bash
node backend/scripts/backup-flujo-actual.cjs
```

---

### **Fase 5: Variables Globales Nuevas**

**Agregar a FlowExecutor.ts:**

```typescript
// Variables para mantener contexto entre mensajes
private productosEnContexto: any[] = [];
private carritoEnProgreso: any = null;
```

**Guardar después de cada búsqueda:**
```typescript
// En executeWooCommerceNode después de buscar
this.setGlobalVariable('productos_presentados', productosSimplificados);
```

**Guardar carrito en progreso:**
```typescript
// En GPT Armar Carrito
this.setGlobalVariable('carrito_en_progreso', carritoData);
```

---

### **Fase 6: Testing**

#### **6.1. Test del Flujo Actual (Sin Cambios)**

```bash
# Limpiar estado
node backend/scripts/limpiar-mi-numero.js

# Probar búsqueda simple
Mensaje: "Busco Harry Potter 2"
Esperado: ✅ Funciona igual que antes

# Probar búsqueda múltiple
Mensaje: "Busco Harry Potter 2 y 5"
Esperado: ✅ Funciona igual que antes
```

#### **6.2. Test del Clasificador**

```bash
# Test 1: Búsqueda (debe ir al flujo actual)
Mensaje: "Busco libros de inglés"
Esperado: tipo_accion = "buscar_producto"
Resultado: ✅ Va al formateador existente

# Test 2: Compra (debe ir al flujo nuevo)
Mensaje: "Quiero comprar el primero"
Esperado: tipo_accion = "comprar"
Resultado: ✅ Va a GPT Armar Carrito
```

#### **6.3. Test del Flujo de Carrito**

```bash
# Flujo completo
1. "Busco Harry Potter 2"
2. "Quiero comprarlo"
3. "Sí, confirmo"
4. "Juan Pérez, juan@example.com"
5. Verificar link de MercadoPago
6. Pagar en sandbox
7. Verificar webhook
8. Verificar mensaje de confirmación
```

---

## 🔄 Rollback Plan

### **Si algo sale mal en Fase 4 o posterior:**

```bash
# 1. Restaurar desde backup
node backend/scripts/restore-flujo-backup.cjs [timestamp]

# 2. Limpiar estado
node backend/scripts/limpiar-mi-numero.js

# 3. Verificar flujo actual
# Enviar: "Busco Harry Potter 2"
# Debe funcionar exactamente igual que antes
```

---

## 📋 Checklist de Implementación

### **Pre-Implementación:**
- [ ] Leer documentación de backup completa
- [ ] Ejecutar `node backend/scripts/backup-flujo-actual.cjs`
- [ ] Crear branch: `git checkout -b feature/carrito-ecommerce`
- [ ] Commit: `git commit -m "backup: Estado actual antes de carrito"`

### **Fase 1: Backend (Sin tocar flujo):**
- [ ] Crear MercadoPagoService.ts
- [ ] Crear webhook endpoint
- [ ] Agregar variables de entorno
- [ ] Probar servicios en aislamiento

### **Fase 2: Nodos Nuevos:**
- [ ] Crear GPT Clasificador
- [ ] Crear Router Principal
- [ ] Crear GPT Armar Carrito
- [ ] Crear Router Carrito
- [ ] Crear nodos de WhatsApp nuevos

### **Fase 3: Integración:**
- [ ] Conectar Clasificador antes del Formateador
- [ ] Verificar que flujo actual sigue funcionando
- [ ] Agregar mensaje guía al GPT Asistente
- [ ] Probar flujo completo

### **Fase 4: Testing:**
- [ ] Test flujo actual (sin cambios)
- [ ] Test clasificador
- [ ] Test carrito completo
- [ ] Test webhook MercadoPago
- [ ] Test casos edge

### **Fase 5: Documentación:**
- [ ] Actualizar documentación de nodos
- [ ] Documentar nuevas variables globales
- [ ] Documentar webhook
- [ ] Crear guía de troubleshooting

---

## 🚨 Puntos Críticos de Atención

### **1. No Romper el Flujo Actual**
- ✅ Clasificador se agrega ANTES, no reemplaza
- ✅ Formateador sigue siendo el mismo
- ✅ WooCommerce no se modifica
- ✅ GPT Asistente solo agrega pregunta al final

### **2. Mantener Compatibilidad**
- ✅ Variables existentes no se modifican
- ✅ Tópicos existentes no se modifican
- ✅ Historial se mantiene igual

### **3. Testing Exhaustivo**
- ✅ Probar flujo actual después de cada cambio
- ✅ Probar con diferentes mensajes
- ✅ Probar casos edge

---

## 📞 Contactos

- **Desarrollador:** Emiliano
- **Teléfono de Prueba:** 5493794946066
- **Empresa:** Veo Veo (5493794732177)

---

## 📝 Log de Cambios

| Fecha | Fase | Estado | Notas |
|-------|------|--------|-------|
| 2026-01-15 | Documentación | ✅ Completado | Backup y plan creados |
| - | Backend | ⏳ Pendiente | MercadoPago + Webhook |
| - | Nodos | ⏳ Pendiente | Clasificador + Carrito |
| - | Testing | ⏳ Pendiente | Pruebas completas |

---

**ÚLTIMA ACTUALIZACIÓN:** 2026-01-15 10:15:00  
**PRÓXIMO PASO:** Ejecutar backup y crear branch de Git

---

## ✅ Confirmación Final

Antes de implementar, confirmar:

- [x] Documentación de backup creada
- [x] Script de backup creado
- [x] Script de restauración creado
- [x] Plan de implementación detallado
- [ ] Backup ejecutado
- [ ] Branch de Git creado
- [ ] Usuario aprueba el plan

**ESTADO:** 🟡 LISTO PARA EJECUTAR BACKUP
